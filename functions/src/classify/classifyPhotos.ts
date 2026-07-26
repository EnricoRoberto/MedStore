import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { SchemaType, VertexAI, type Part, type Schema } from "@google-cloud/vertexai";

const CONFIDENCE_THRESHOLD = 0.6;

interface ClassifyPhotosRequest {
  sessionId: string;
}

interface GeminiBox {
  photoIndexes: number[];
  producer: string;
  name: string;
  activeIngredient: string;
  indication: string;
  requiresPrescription: boolean;
  expirationDate: string | null;
  confidence: number;
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    boxes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          photoIndexes: { type: SchemaType.ARRAY, items: { type: SchemaType.INTEGER } },
          producer: { type: SchemaType.STRING },
          name: { type: SchemaType.STRING },
          activeIngredient: { type: SchemaType.STRING },
          indication: { type: SchemaType.STRING },
          requiresPrescription: { type: SchemaType.BOOLEAN },
          expirationDate: { type: SchemaType.STRING, nullable: true },
          confidence: { type: SchemaType.NUMBER },
        },
        required: [
          "photoIndexes",
          "producer",
          "name",
          "activeIngredient",
          "indication",
          "requiresPrescription",
          "confidence",
        ],
      },
    },
  },
  required: ["boxes"],
};

const PROMPT = `Sei un assistente che analizza foto di confezioni di farmaci fotografate insieme su un tavolo di casa, alcune scattate dopo aver girato le confezioni per mostrare altri lati (marca, produttore, data di scadenza).

Analizza tutte le foto fornite (indicizzate a partire da 0 nell'ordine in cui te le passo) e individua ogni confezione fisica distinta, anche se compare in più foto da angolazioni diverse. Per ciascuna confezione:
- indica in "photoIndexes" gli indici di tutte le foto in cui è visibile;
- estrai produttore, nome del farmaco, principio attivo, destinazione d'uso;
- indica se richiede prescrizione medica (contesto Italia: es. molti antidolorifici/antinfiammatori da banco non la richiedono, gli antibiotici sì) usando il tuo miglior giudizio;
- estrai la data di scadenza se leggibile, in formato YYYY-MM-DD, altrimenti null;
- indica un livello di confidenza complessivo da 0 a 1 su quanto sei sicuro dell'identificazione e della corrispondenza tra foto.

Se due confezioni sembrano simili ma non sei sicuro che siano la stessa confezione fisica, trattale come voci separate con confidenza più bassa piuttosto che unirle a caso. Rispondi solo con il JSON richiesto.`;

// Vertex AI in Firebase (Gemini) è invocato solo da questa Cloud Function
// callable: nessuna API key esposta lato client.
export const classifyPhotos = onCall<ClassifyPhotosRequest>(
  { region: "europe-west1", timeoutSeconds: 120, memory: "512MiB" },
  async (request) => {
    if (!request.auth?.token.allowlisted) {
      throw new HttpsError("permission-denied", "Utente non autorizzato.");
    }

    const sessionId = request.data.sessionId;
    if (!sessionId) {
      throw new HttpsError("invalid-argument", "sessionId mancante.");
    }

    const db = getFirestore();
    const sessionRef = db.collection("inventorySessions").doc(sessionId);

    const [photosSnap, boxesSnap] = await Promise.all([
      sessionRef.collection("photos").orderBy("uploadedAt", "asc").get(),
      sessionRef.collection("detectedBoxes").get(),
    ]);

    const alreadyLinkedPhotoIds = new Set<string>();
    for (const boxDoc of boxesSnap.docs) {
      const photoIds = boxDoc.data().photoIds as string[] | undefined;
      for (const photoId of photoIds ?? []) {
        alreadyLinkedPhotoIds.add(photoId);
      }
    }

    const candidatePhotos = photosSnap.docs.filter((photoDoc) => {
      const data = photoDoc.data();
      return (
        (data.type === "general" || data.type === "rotation") &&
        !alreadyLinkedPhotoIds.has(photoDoc.id)
      );
    });

    if (candidatePhotos.length === 0) {
      return { boxesCreated: 0 };
    }

    const bucket = getStorage().bucket();
    const imageParts: Part[] = await Promise.all(
      candidatePhotos.map(async (photoDoc) => {
        const data = photoDoc.data();
        const [bytes] = await bucket.file(data.storagePath as string).download();
        return {
          inlineData: {
            mimeType: (data.contentType as string | undefined) ?? "image/jpeg",
            data: bytes.toString("base64"),
          },
        };
      }),
    );

    const vertexAI = new VertexAI({
      project: process.env.GCLOUD_PROJECT,
      location: "us-central1",
    });
    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: PROMPT }, ...imageParts] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new HttpsError("internal", "Nessuna risposta dal modello di classificazione.");
    }

    let parsed: { boxes: GeminiBox[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new HttpsError("internal", "Risposta del modello non interpretabile.");
    }

    const batch = db.batch();
    let boxesCreated = 0;
    for (const box of parsed.boxes ?? []) {
      const photoIds = box.photoIndexes
        .map((index) => candidatePhotos[index]?.id)
        .filter((id): id is string => Boolean(id));

      if (photoIds.length === 0) continue;

      const status = box.confidence >= CONFIDENCE_THRESHOLD ? "classified" : "needs_more_photos";
      const boxRef = sessionRef.collection("detectedBoxes").doc();
      batch.set(boxRef, {
        label: box.name || `Confezione ${boxesCreated + 1}`,
        status,
        photoIds,
        confidence: box.confidence,
        classification: {
          producer: box.producer ?? "",
          name: box.name ?? "",
          activeIngredient: box.activeIngredient ?? "",
          indication: box.indication ?? "",
          requiresPrescription: box.requiresPrescription ?? false,
          tags: [],
          quantityPercent: 100,
          expirationDate: box.expirationDate ?? null,
          status: "active",
        },
        medicationId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      boxesCreated += 1;
    }
    await batch.commit();

    return { boxesCreated };
  },
);

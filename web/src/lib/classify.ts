import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BoxStatus } from "../types/inventorySession";

const SESSIONS_COLLECTION = "inventorySessions";
const CONFIDENCE_THRESHOLD = 0.6;

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

function inlineDataFromDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) {
    throw new Error("Foto non valida.");
  }
  return { mimeType: match[1], data: match[2] };
}

// Nessuna Cloud Function: la classificazione chiama direttamente la Gemini
// Developer API dal browser con una API key vincolata (referrer + sola API
// Generative Language), invece di Vertex AI in Firebase (che richiederebbe
// il piano Blaze).
export async function classifyPhotosWithAi(sessionId: string): Promise<number> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY non configurata.");
  }

  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

  const [photosSnap, boxesSnap] = await Promise.all([
    getDocs(query(collection(sessionRef, "photos"), orderBy("uploadedAt", "asc"))),
    getDocs(collection(sessionRef, "detectedBoxes")),
  ]);

  const alreadyLinkedPhotoIds = new Set<string>();
  for (const boxDoc of boxesSnap.docs) {
    const photoIds = boxDoc.data().photoIds as string[] | undefined;
    for (const photoId of photoIds ?? []) {
      alreadyLinkedPhotoIds.add(photoId);
    }
  }

  const candidatePhotos = photosSnap.docs.filter((photoDoc: QueryDocumentSnapshot<DocumentData>) => {
    const data = photoDoc.data();
    return (
      (data.type === "general" || data.type === "rotation") &&
      !alreadyLinkedPhotoIds.has(photoDoc.id)
    );
  });

  if (candidatePhotos.length === 0) {
    return 0;
  }

  const imageParts = candidatePhotos.map((photoDoc) => ({
    inlineData: inlineDataFromDataUrl(photoDoc.data().dataUrl as string),
  }));

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", responseSchema },
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: PROMPT }, ...imageParts] }],
  });

  let parsed: { boxes: GeminiBox[] };
  try {
    parsed = JSON.parse(result.response.text());
  } catch {
    throw new Error("Risposta del modello non interpretabile.");
  }

  const batch = writeBatch(db);
  let boxesCreated = 0;
  for (const box of parsed.boxes ?? []) {
    const photoIds = box.photoIndexes
      .map((index) => candidatePhotos[index]?.id)
      .filter((id): id is string => Boolean(id));

    if (photoIds.length === 0) continue;

    const status: BoxStatus = box.confidence >= CONFIDENCE_THRESHOLD ? "classified" : "needs_more_photos";
    const boxRef = doc(collection(sessionRef, "detectedBoxes"));
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    boxesCreated += 1;
  }
  await batch.commit();

  return boxesCreated;
}

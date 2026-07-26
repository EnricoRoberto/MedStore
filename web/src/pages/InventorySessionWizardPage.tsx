import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BoxConfirmActions } from "../components/BoxConfirmActions";
import { MedicationFields } from "../components/MedicationFields";
import { PhotoThumbnails } from "../components/PhotoThumbnails";
import { QuantityBar } from "../components/QuantityBar";
import { useAuth } from "../lib/auth";
import {
  addDetectedBox,
  classifyBox,
  classifyPhotosWithAi,
  completeInventorySession,
  confirmBoxAsExistingMedication,
  confirmBoxAsNewMedication,
  linkPhotoToBox,
  setBoxStatus,
  uploadSessionPhoto,
  useDetectedBoxes,
  useInventorySession,
  usePhotos,
} from "../lib/inventorySessions";
import { useMedications } from "../lib/medications";
import type { DetectedBox, SessionPhoto } from "../types/inventorySession";
import type { MedicationFormValues } from "../types/medication";

const emptyClassification: MedicationFormValues = {
  producer: "",
  name: "",
  activeIngredient: "",
  indication: "",
  requiresPrescription: false,
  tags: [],
  quantityPercent: 100,
  expirationDate: null,
  status: "active",
};

const STATUS_LABELS: Record<DetectedBox["status"], string> = {
  unclassified: "Da classificare",
  needs_more_photos: "Serve un'altra foto",
  classified: "Classificata, da confermare",
  confirmed: "Confermata (nuovo farmaco)",
  merged_into_existing: "Confermata (aggiornato farmaco esistente)",
};

function boxPhotoRefs(box: DetectedBox, photos: SessionPhoto[]): string[] {
  return photos.filter((photo) => box.photoIds.includes(photo.id)).map((photo) => photo.storagePath);
}

export function InventorySessionWizardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const session = useInventorySession(sessionId);
  const photos = usePhotos(sessionId);
  const boxes = useDetectedBoxes(sessionId);
  const medications = useMedications();

  const [newBoxLabel, setNewBoxLabel] = useState("");
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MedicationFormValues>(emptyClassification);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [classifying, setClassifying] = useState(false);

  const editorLabel = user?.email ?? "sconosciuto";
  const generalPhotos = photos.filter((p) => p.type === "general");
  const rotationPhotos = photos.filter((p) => p.type === "rotation");

  if (session === undefined) {
    return <p className="text-sm text-slate-500">Caricamento…</p>;
  }

  if (session === null) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Sessione di inventario non trovata.
      </p>
    );
  }

  if (session.status === "completed") {
    const newCount = boxes.filter((b) => b.status === "confirmed").length;
    const mergedCount = boxes.filter((b) => b.status === "merged_into_existing").length;
    const unresolvedCount = boxes.length - newCount - mergedCount;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Sessione di inventario</h1>
          <p className="mt-1 text-sm text-slate-500">
            {session.startedAt?.toDate().toLocaleDateString("it-IT") ?? "…"}
            {" – "}
            {session.completedAt?.toDate().toLocaleDateString("it-IT") ?? "…"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">
            {newCount} nuovi farmaci
          </span>
          <span className="rounded-full bg-teal-100 px-3 py-1 font-medium text-teal-800">
            {mergedCount} farmaci aggiornati
          </span>
          {unresolvedCount > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              {unresolvedCount} non completati
            </span>
          )}
        </div>

        <ul className="space-y-2">
          {boxes.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Nessuna confezione registrata in questa sessione.
            </p>
          )}
          {boxes.map((box) => (
            <li
              key={box.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {box.classification?.name || box.label}
                </p>
                <p className="text-xs text-slate-500">
                  {box.classification?.producer || "Produttore sconosciuto"} ·{" "}
                  {STATUS_LABELS[box.status]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {box.classification && (
                  <div className="w-28">
                    <QuantityBar percent={box.classification.quantityPercent} />
                  </div>
                )}
                {box.medicationId && (
                  <Link
                    to={`/farmaci/${box.medicationId}`}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Vedi farmaco
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  async function handleUpload(files: FileList | null, type: "general" | "rotation") {
    if (!files || !sessionId) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadSessionPhoto(sessionId, file, type, editorLabel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento foto non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTargetedUpload(files: FileList | null, boxId: string) {
    if (!files || !sessionId) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const photoId = await uploadSessionPhoto(sessionId, file, "targeted", editorLabel, boxId);
        await linkPhotoToBox(sessionId, boxId, photoId);
      }
      await setBoxStatus(sessionId, boxId, "unclassified");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento foto non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddBox() {
    if (!sessionId || !newBoxLabel.trim()) return;
    await addDetectedBox(sessionId, newBoxLabel.trim());
    setNewBoxLabel("");
  }

  async function handleClassifyWithAi() {
    if (!sessionId) return;
    setClassifying(true);
    setError(null);
    setInfo(null);
    try {
      const boxesCreated = await classifyPhotosWithAi(sessionId);
      setInfo(
        boxesCreated > 0
          ? `Individuate ${boxesCreated} nuove confezioni.`
          : "Nessuna nuova confezione individuata nelle foto disponibili. Aggiungi altre foto o classifica manualmente.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classificazione IA non riuscita.");
    } finally {
      setClassifying(false);
    }
  }

  function openClassification(box: DetectedBox) {
    setActiveBoxId(box.id);
    setDraft(box.classification ?? emptyClassification);
  }

  async function saveClassification() {
    if (!sessionId || !activeBoxId) return;
    if (!draft.name.trim()) {
      setError("Il nome del farmaco è obbligatorio.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await classifyBox(sessionId, activeBoxId, draft);
      setActiveBoxId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmNew(box: DetectedBox) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await confirmBoxAsNewMedication(sessionId, box, editorLabel, boxPhotoRefs(box, photos));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conferma non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmExisting(box: DetectedBox, medicationId: string) {
    if (!sessionId || !medicationId) return;
    setBusy(true);
    setError(null);
    try {
      await confirmBoxAsExistingMedication(
        sessionId,
        box,
        medicationId,
        editorLabel,
        boxPhotoRefs(box, photos),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conferma non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  const pendingCount = boxes.filter(
    (b) => b.status !== "confirmed" && b.status !== "merged_into_existing",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Sessione di inventario</h1>
        <button
          disabled={busy}
          onClick={() => sessionId && void completeInventorySession(sessionId)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          Termina sessione
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-teal-700">{info}</p>}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">1. Foto d'insieme</h2>
        <p className="mt-1 text-sm text-slate-500">
          Scatta una foto con tutte le confezioni disposte sul tavolo.
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void handleUpload(e.target.files, "general")}
          className="mt-3 text-sm"
        />
        <PhotoThumbnails photos={generalPhotos} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-800">2. Foto delle confezioni girate</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gira le scatole per mostrare marca, produttore e scadenza, e scatta altre foto dello
          stesso gruppo.
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void handleUpload(e.target.files, "rotation")}
          className="mt-3 text-sm"
        />
        <PhotoThumbnails photos={rotationPhotos} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">3. Confezioni rilevate</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              {pendingCount} da completare
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Fai analizzare le foto dall'IA per individuare le confezioni automaticamente, oppure
          aggiungine una manualmente se qualcuna non viene riconosciuta. Ogni confezione va poi
          classificata (o corretta) e confermata.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            disabled={classifying || generalPhotos.length === 0}
            onClick={() => void handleClassifyWithAi()}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {classifying ? "Analisi in corso…" : "✨ Classifica con IA"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newBoxLabel}
            onChange={(e) => setNewBoxLabel(e.target.value)}
            placeholder="Es. Scatola 1"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => void handleAddBox()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            + Aggiungi manualmente
          </button>
        </div>

        <ul className="mt-4 space-y-3">
          {boxes.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Nessuna confezione aggiunta ancora.
            </p>
          )}
          {boxes.map((box) => {
            const isDone = box.status === "confirmed" || box.status === "merged_into_existing";
            return (
              <li key={box.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {box.classification?.name || box.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {STATUS_LABELS[box.status]}
                      {box.confidence !== null &&
                        ` · Confidenza IA: ${Math.round(box.confidence * 100)}%`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isDone && (
                      <button
                        onClick={() => openClassification(box)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {box.classification ? "Modifica classificazione" : "Classifica"}
                      </button>
                    )}
                    {box.status === "classified" && (
                      <BoxConfirmActions
                        medications={medications ?? []}
                        onConfirmNew={() => void handleConfirmNew(box)}
                        onConfirmExisting={(medicationId) =>
                          void handleConfirmExisting(box, medicationId)
                        }
                      />
                    )}
                  </div>
                </div>

                {!isDone && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500">
                      Non si legge bene la scatola? Scatta una foto mirata:
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={(e) => void handleTargetedUpload(e.target.files, box.id)}
                      className="mt-1 text-sm"
                    />
                    <PhotoThumbnails
                      photos={photos.filter((p) => p.type === "targeted" && p.boxId === box.id)}
                    />
                  </div>
                )}

                {activeBoxId === box.id && (
                  <div className="mt-3 space-y-4 rounded-md border border-teal-200 bg-teal-50/40 p-4">
                    <MedicationFields values={draft} onChange={setDraft} />
                    <div className="flex gap-3">
                      <button
                        disabled={busy}
                        onClick={() => void saveClassification()}
                        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        Salva classificazione
                      </button>
                      <button
                        onClick={() => setActiveBoxId(null)}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

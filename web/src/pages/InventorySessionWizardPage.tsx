import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BoxConfirmActions } from "../components/BoxConfirmActions";
import { MedicationFields } from "../components/MedicationFields";
import { PhotoThumbnails } from "../components/PhotoThumbnails";
import { QuantityBar } from "../components/QuantityBar";
import { useAuth } from "../lib/auth";
import { classifyPhotosWithAi, refineMedicationWithAi } from "../lib/classify";
import {
  addDetectedBox,
  classifyBox,
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
  minQuantityPercent: null,
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

function boxPhotos(box: DetectedBox, photos: SessionPhoto[]): SessionPhoto[] {
  return photos.filter((photo) => box.photoIds.includes(photo.id));
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
  const [refiningBoxId, setRefiningBoxId] = useState<string | null>(null);
  const generalInputRef = useRef<HTMLInputElement>(null);
  const rotationInputRef = useRef<HTMLInputElement>(null);

  const editorLabel = user?.email ?? "sconosciuto";
  const generalPhotos = photos.filter((p) => p.type === "general");
  const rotationPhotos = photos.filter((p) => p.type === "rotation");

  if (session === undefined) {
    return <p className="text-sm text-stone-500">Caricamento…</p>;
  }

  if (session === null) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
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
          <h1 className="text-xl font-semibold text-stone-800">Sessione di inventario</h1>
          <p className="mt-1 text-sm text-stone-500">
            {session.startedAt?.toDate().toLocaleDateString("it-IT") ?? "…"}
            {" – "}
            {session.completedAt?.toDate().toLocaleDateString("it-IT") ?? "…"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-sage-100 px-3 py-1 font-medium text-sage-800">
            {newCount} nuovi farmaci
          </span>
          <span className="rounded-full bg-terracotta-100 px-3 py-1 font-medium text-terracotta-800">
            {mergedCount} farmaci aggiornati
          </span>
          {unresolvedCount > 0 && (
            <span className="rounded-full bg-stone-100 px-3 py-1 font-medium text-stone-600">
              {unresolvedCount} non completati
            </span>
          )}
        </div>

        <ul className="space-y-2">
          {boxes.length === 0 && (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
              Nessuna confezione registrata in questa sessione.
            </p>
          )}
          {boxes.map((box) => (
            <li
              key={box.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-stone-800">
                  {box.classification?.name || box.label}
                </p>
                <p className="text-xs text-stone-500">
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
                    className="text-xs font-medium text-terracotta-700 hover:underline"
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

  // Rilegge con l'IA tutte le foto già collegate a questa confezione (foto
  // d'insieme, girate e mirate insieme): utile dopo aver aggiunto una foto
  // mirata che mostra un dato prima illeggibile (es. la data di scadenza),
  // senza dover creare una nuova confezione separata per la stessa scatola.
  async function handleRefineBoxWithAi(box: DetectedBox) {
    const linkedPhotos = boxPhotos(box, photos);
    if (linkedPhotos.length === 0) return;
    setRefiningBoxId(box.id);
    setError(null);
    setInfo(null);
    try {
      const refined = await refineMedicationWithAi(linkedPhotos.map((p) => p.dataUrl));
      setActiveBoxId(box.id);
      setDraft({ ...(box.classification ?? emptyClassification), ...refined });
      setInfo("Dati aggiornati dall'IA: controllali e premi Salva classificazione per confermarli.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rianalisi IA non riuscita.");
    } finally {
      setRefiningBoxId(null);
    }
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
      await confirmBoxAsNewMedication(sessionId, box, editorLabel, boxPhotos(box, photos));
      setActiveBoxId(null);
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
        boxPhotos(box, photos),
      );
      setActiveBoxId(null);
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
        <h1 className="text-xl font-semibold text-stone-800">Sessione di inventario</h1>
        <button
          disabled={busy}
          onClick={() => sessionId && void completeInventorySession(sessionId)}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          Termina sessione
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-terracotta-700">{info}</p>}

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-800">1. Foto d'insieme</h2>
        <p className="mt-1 text-sm text-stone-500">
          Scatta una foto con le confezioni disposte sul tavolo. Se non entrano tutte
          nell'inquadratura, va benissimo: scattane quante ne servono, l'IA le analizza tutte
          insieme.
        </p>
        <input
          ref={generalInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void handleUpload(e.target.files, "general")}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => generalInputRef.current?.click()}
          className="mt-3 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {generalPhotos.length === 0 ? "📷 Scatta foto d'insieme" : "+ Aggiungi un'altra foto d'insieme"}
        </button>
        <PhotoThumbnails photos={generalPhotos} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-800">2. Foto delle confezioni girate</h2>
        <p className="mt-1 text-sm text-stone-500">
          Gira le scatole per mostrare marca, produttore e scadenza, e scatta altre foto dello
          stesso gruppo (anche qui, quante te ne servono).
        </p>
        <input
          ref={rotationInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void handleUpload(e.target.files, "rotation")}
          className="hidden"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => rotationInputRef.current?.click()}
          className="mt-3 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
        >
          {rotationPhotos.length === 0 ? "📷 Scatta foto girate" : "+ Aggiungi un'altra foto"}
        </button>
        <PhotoThumbnails photos={rotationPhotos} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-800">3. Confezioni rilevate</h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              {pendingCount} da completare
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-stone-500">
          Fai analizzare le foto dall'IA per individuare le confezioni automaticamente, oppure
          aggiungine una manualmente se qualcuna non viene riconosciuta. Ogni confezione va poi
          classificata (o corretta) e confermata.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            disabled={classifying || generalPhotos.length === 0}
            onClick={() => void handleClassifyWithAi()}
            className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
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
            className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => void handleAddBox()}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            + Aggiungi manualmente
          </button>
        </div>

        <ul className="mt-4 space-y-3">
          {boxes.length === 0 && (
            <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              Nessuna confezione aggiunta ancora.
            </p>
          )}
          {boxes.map((box) => {
            const isDone = box.status === "confirmed" || box.status === "merged_into_existing";
            return (
              <li key={box.id} className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-800">
                      {box.classification?.name || box.label}
                    </p>
                    <p className="text-xs text-stone-500">
                      {STATUS_LABELS[box.status]}
                      {box.confidence !== null &&
                        ` · Confidenza IA: ${Math.round(box.confidence * 100)}%`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isDone && (
                      <button
                        onClick={() => openClassification(box)}
                        className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Rivedi/Modifica
                      </button>
                    )}
                    {box.status === "classified" && activeBoxId !== box.id && (
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
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <p className="text-xs text-stone-500">
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
                    <button
                      type="button"
                      disabled={refiningBoxId === box.id}
                      onClick={() => void handleRefineBoxWithAi(box)}
                      className="mt-2 rounded-xl bg-sage-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-700 disabled:opacity-50"
                    >
                      {refiningBoxId === box.id
                        ? "Analisi in corso…"
                        : "✨ Rianalizza con IA (tutte le foto di questa confezione)"}
                    </button>
                  </div>
                )}

                {activeBoxId === box.id && (
                  <div className="mt-3 space-y-4 rounded-xl border border-terracotta-200 bg-terracotta-50/40 p-4">
                    <MedicationFields values={draft} onChange={setDraft} />
                    <div className="flex gap-3">
                      <button
                        disabled={busy}
                        onClick={() => void saveClassification()}
                        className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
                      >
                        Salva classificazione
                      </button>
                      <button
                        onClick={() => setActiveBoxId(null)}
                        className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                      >
                        Chiudi
                      </button>
                    </div>
                    {box.status === "classified" && (
                      <div className="border-t border-terracotta-200 pt-3">
                        <p className="mb-2 text-xs font-medium text-stone-600">
                          Classificazione salvata: conferma quando sei pronto.
                        </p>
                        <BoxConfirmActions
                          medications={medications ?? []}
                          onConfirmNew={() => void handleConfirmNew(box)}
                          onConfirmExisting={(medicationId) =>
                            void handleConfirmExisting(box, medicationId)
                          }
                        />
                      </div>
                    )}
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

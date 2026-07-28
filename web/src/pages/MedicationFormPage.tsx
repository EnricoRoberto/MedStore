import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChangeLogList } from "../components/ChangeLogList";
import { MedicationFields } from "../components/MedicationFields";
import { PhotoThumbnails } from "../components/PhotoThumbnails";
import { useAuth } from "../lib/auth";
import { refineMedicationWithAi } from "../lib/classify";
import {
  deleteMedication,
  createMedication,
  updateMedication,
  uploadMedicationPhoto,
  useMedication,
  useMedicationPhotos,
} from "../lib/medications";
import { useNotificationThresholds } from "../lib/notificationThresholds";
import type { MedicationFormValues, MedicationStatus } from "../types/medication";

const emptyForm: MedicationFormValues = {
  producer: "",
  name: "",
  activeIngredient: "",
  indication: "",
  requiresPrescription: false,
  requiresRefrigeration: false,
  tags: [],
  quantityPercent: 100,
  minQuantityPercent: null,
  expirationDate: null,
  status: "active",
};

export function MedicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const existing = useMedication(id);
  const photos = useMedicationPhotos(id);
  const thresholds = useNotificationThresholds();

  const [form, setForm] = useState<MedicationFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const editorLabel = user?.email ?? "sconosciuto";

  useEffect(() => {
    if (existing) {
      setForm({
        producer: existing.producer,
        name: existing.name,
        activeIngredient: existing.activeIngredient,
        indication: existing.indication,
        requiresPrescription: existing.requiresPrescription,
        requiresRefrigeration: existing.requiresRefrigeration,
        tags: existing.tags,
        quantityPercent: existing.quantityPercent,
        minQuantityPercent: existing.minQuantityPercent,
        expirationDate: existing.expirationDate,
        status: existing.status,
      });
    }
  }, [existing]);

  if (!isNew && existing === undefined) {
    return <p className="text-sm text-stone-500">Caricamento…</p>;
  }

  if (!isNew && existing === null) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
        Farmaco non trovato.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Il nome del farmaco è obbligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await createMedication(form, editorLabel);
        navigate("/");
      } else if (id) {
        await updateMedication(id, form, editorLabel);
        navigate(`/farmaci/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm(`Eliminare definitivamente "${form.name || "questo farmaco"}"? L'azione non è reversibile.`)) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteMedication(id);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eliminazione non riuscita.");
      setDeleting(false);
    }
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || !id) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        await uploadMedicationPhoto(id, file, editorLabel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento foto non riuscito.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRefineWithAi() {
    if (photos.length === 0) return;
    setRefining(true);
    setError(null);
    setInfo(null);
    try {
      const refined = await refineMedicationWithAi(photos.map((p) => p.dataUrl));
      setForm((prev) => ({ ...prev, ...refined }));
      setInfo("Dati aggiornati dall'IA: controllali e premi Salva per confermarli.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Affinamento IA non riuscito.");
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-stone-800">
          {isNew ? "Nuovo farmaco" : form.name || "Modifica farmaco"}
        </h1>
        {existing?.lastModifiedBy && (
          <p className="mt-1 text-xs text-stone-500">
            Ultima modifica di {existing.lastModifiedBy}
            {existing.lastModifiedAt &&
              ` il ${existing.lastModifiedAt.toDate().toLocaleString("it-IT")}`}
          </p>
        )}
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5"
      >
        <MedicationFields
          values={form}
          onChange={setForm}
          defaultMinQuantityPercent={thresholds.lowQuantityPercent}
        />

        {!isNew && (
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Stato</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MedicationStatus })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm sm:max-w-xs"
            >
              <option value="active">Attivo</option>
              <option value="archived">Archiviato</option>
            </select>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-sage-700">{info}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
          <button
            type="button"
            onClick={() => navigate(isNew ? "/" : `/farmaci/${id}`)}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            Annulla
          </button>
          {!isNew && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="ml-auto rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Eliminazione…" : "Elimina farmaco"}
            </button>
          )}
        </div>
      </form>

      {!isNew && id && (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
          <div>
            <h2 className="text-base font-semibold text-stone-800">Foto aggiuntive</h2>
            <p className="mt-1 text-sm text-stone-500">
              Aggiungi altre foto di questa confezione (es. lato con la scadenza) per affinare i
              dati con l'IA senza dover rifare una sessione di inventario.
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            disabled={uploadingPhoto}
            onChange={(e) => void handlePhotoUpload(e.target.files)}
            className="text-sm"
          />
          <PhotoThumbnails photos={photos} />
          <button
            type="button"
            disabled={refining || photos.length === 0}
            onClick={() => void handleRefineWithAi()}
            className="rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-50"
          >
            {refining ? "Analisi in corso…" : "✨ Affina con IA"}
          </button>
        </section>
      )}

      {!isNew && id && <ChangeLogList medicationId={id} />}
    </div>
  );
}

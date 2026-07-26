import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChangeLogList } from "../components/ChangeLogList";
import { MedicationFields } from "../components/MedicationFields";
import { useAuth } from "../lib/auth";
import { createMedication, updateMedication, useMedication } from "../lib/medications";
import type { MedicationFormValues, MedicationStatus } from "../types/medication";

const emptyForm: MedicationFormValues = {
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

export function MedicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const existing = useMedication(id);

  const [form, setForm] = useState<MedicationFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        producer: existing.producer,
        name: existing.name,
        activeIngredient: existing.activeIngredient,
        indication: existing.indication,
        requiresPrescription: existing.requiresPrescription,
        tags: existing.tags,
        quantityPercent: existing.quantityPercent,
        expirationDate: existing.expirationDate,
        status: existing.status,
      });
    }
  }, [existing]);

  if (!isNew && existing === undefined) {
    return <p className="text-sm text-slate-500">Caricamento…</p>;
  }

  if (!isNew && existing === null) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
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
    const editorLabel = user?.email ?? "sconosciuto";
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">
        {isNew ? "Nuovo farmaco" : form.name || "Modifica farmaco"}
      </h1>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
      >
        <MedicationFields values={form} onChange={setForm} />

        {!isNew && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Stato</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as MedicationStatus })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-xs"
            >
              <option value="active">Attivo</option>
              <option value="archived">Archiviato</option>
            </select>
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
          <button
            type="button"
            onClick={() => navigate(isNew ? "/" : `/farmaci/${id}`)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Annulla
          </button>
        </div>
      </form>

      {!isNew && id && <ChangeLogList medicationId={id} />}
    </div>
  );
}

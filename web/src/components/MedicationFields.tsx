import { QuantityBar } from "./QuantityBar";
import { TagInput } from "./TagInput";
import type { MedicationFormValues } from "../types/medication";

interface MedicationFieldsProps {
  values: MedicationFormValues;
  onChange: (values: MedicationFormValues) => void;
}

export function MedicationFields({ values, onChange }: MedicationFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Nome farmaco *</span>
          <input
            type="text"
            required
            value={values.name}
            onChange={(e) => onChange({ ...values, name: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Produttore</span>
          <input
            type="text"
            value={values.producer}
            onChange={(e) => onChange({ ...values, producer: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Principio attivo</span>
          <input
            type="text"
            value={values.activeIngredient}
            onChange={(e) => onChange({ ...values, activeIngredient: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Destinazione d'uso</span>
          <input
            type="text"
            value={values.indication}
            onChange={(e) => onChange({ ...values, indication: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Scadenza</span>
          <input
            type="date"
            value={values.expirationDate ?? ""}
            onChange={(e) => onChange({ ...values, expirationDate: e.target.value || null })}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={values.requiresPrescription}
            onChange={(e) => onChange({ ...values, requiresPrescription: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-medium text-slate-700">Richiede ricetta medica</span>
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Tag (persone che lo usano)</span>
        <div className="mt-1">
          <TagInput tags={values.tags} onChange={(tags) => onChange({ ...values, tags })} />
        </div>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">
          Quantità residua: {values.quantityPercent}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={values.quantityPercent}
          onChange={(e) => onChange({ ...values, quantityPercent: Number(e.target.value) })}
          className="mt-2 w-full"
        />
        <div className="mt-1">
          <QuantityBar percent={values.quantityPercent} />
        </div>
      </label>
    </>
  );
}

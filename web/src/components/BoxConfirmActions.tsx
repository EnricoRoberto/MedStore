import { useState } from "react";

interface MedicationOption {
  id: string;
  name: string;
}

interface BoxConfirmActionsProps {
  medications: MedicationOption[];
  onConfirmNew: () => void;
  onConfirmExisting: (medicationId: string) => void;
}

export function BoxConfirmActions({
  medications,
  onConfirmNew,
  onConfirmExisting,
}: BoxConfirmActionsProps) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [medicationId, setMedicationId] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "new" | "existing")}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
      >
        <option value="new">Nuovo farmaco</option>
        <option value="existing">Farmaco già censito</option>
      </select>
      {mode === "existing" && (
        <select
          value={medicationId}
          onChange={(e) => setMedicationId(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        >
          <option value="">Seleziona…</option>
          {medications.map((medication) => (
            <option key={medication.id} value={medication.id}>
              {medication.name}
            </option>
          ))}
        </select>
      )}
      <button
        disabled={mode === "existing" && !medicationId}
        onClick={() => (mode === "new" ? onConfirmNew() : onConfirmExisting(medicationId))}
        className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        Conferma
      </button>
    </div>
  );
}

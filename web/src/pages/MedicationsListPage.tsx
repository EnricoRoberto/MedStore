import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QuantityBar } from "../components/QuantityBar";
import { useMedications } from "../lib/medications";
import type { Medication } from "../types/medication";

function matchesSearch(medication: Medication, term: string): boolean {
  if (!term) return true;
  const haystack = [
    medication.name,
    medication.producer,
    medication.activeIngredient,
    medication.indication,
    ...medication.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export function MedicationsListPage() {
  const medications = useMedications();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!medications) return [];
    return medications.filter((medication) => matchesSearch(medication, search));
  }, [medications, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome, produttore, principio attivo o tag…"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-sm"
        />
        <Link
          to="/farmaci/nuovo"
          className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          + Nuovo farmaco
        </Link>
      </div>

      {medications === null && <p className="text-sm text-slate-500">Caricamento…</p>}

      {medications !== null && filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {medications.length === 0
            ? "Nessun farmaco censito. Aggiungine uno per iniziare."
            : "Nessun farmaco corrisponde alla ricerca."}
        </p>
      )}

      <ul className="space-y-2">
        {filtered.map((medication) => (
          <li key={medication.id}>
            <Link
              to={`/farmaci/${medication.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">
                    {medication.name}
                    {medication.status === "archived" && (
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                        Archiviato
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {medication.producer || "Produttore sconosciuto"}
                    {medication.tags.length > 0 && ` · ${medication.tags.join(", ")}`}
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <QuantityBar percent={medication.quantityPercent} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

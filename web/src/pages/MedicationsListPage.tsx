import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QuantityBar } from "../components/QuantityBar";
import { deleteAllMedications, useMedications } from "../lib/medications";
import { getMedicationBadge } from "../lib/medicationStatus";
import { useNotificationThresholds } from "../lib/notificationThresholds";
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
  const thresholds = useNotificationThresholds();
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!medications) return [];
    return medications.filter((medication) => matchesSearch(medication, search));
  }, [medications, search]);

  async function handleClearAll() {
    if (!medications || medications.length === 0) return;
    if (
      !window.confirm(
        `Svuotare tutto l'inventario? Verranno eliminati definitivamente tutti i ${medications.length} farmaci censiti. L'azione non è reversibile.`,
      )
    ) {
      return;
    }
    setClearing(true);
    setError(null);
    try {
      await deleteAllMedications(medications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Svuotamento non riuscito.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca per nome, produttore, principio attivo o tag…"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm sm:max-w-sm"
        />
        <div className="flex shrink-0 gap-2">
          <Link
            to="/farmaci/nuovo"
            className="inline-flex items-center justify-center rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
          >
            + Nuovo farmaco
          </Link>
          {medications && medications.length > 0 && (
            <button
              type="button"
              disabled={clearing}
              onClick={() => void handleClearAll()}
              className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {clearing ? "Svuotamento…" : "Svuota tutto"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {medications === null && <p className="text-sm text-stone-500">Caricamento…</p>}

      {medications !== null && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          {medications.length === 0
            ? "Nessun farmaco censito. Aggiungine uno per iniziare."
            : "Nessun farmaco corrisponde alla ricerca."}
        </p>
      )}

      <ul className="space-y-2">
        {filtered.map((medication) => {
          const badge =
            medication.status === "active" ? getMedicationBadge(medication, thresholds) : null;
          return (
            <li key={medication.id}>
              <Link
                to={`/farmaci/${medication.id}`}
                className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-terracotta-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-stone-800">
                      {medication.name}
                      {medication.status === "archived" && (
                        <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-500">
                          Archiviato
                        </span>
                      )}
                      {badge && (
                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            badge.tone === "red"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-stone-500">
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
          );
        })}
      </ul>
    </div>
  );
}

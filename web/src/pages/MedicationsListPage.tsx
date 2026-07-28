import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MedicationListItem } from "../components/MedicationListItem";
import { deleteAllMedications, useMedications } from "../lib/medications";
import { useNotificationThresholds } from "../lib/notificationThresholds";
import type { Medication } from "../types/medication";

const GROUPED_VIEW_KEY = "medstore-medications-grouped";
const UNSPECIFIED_GROUP = "Uso non specificato";

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

function groupByIndication(medications: Medication[]): [string, Medication[]][] {
  const groups = new Map<string, Medication[]>();
  for (const medication of medications) {
    const key = medication.indication.trim() || UNSPECIFIED_GROUP;
    const list = groups.get(key);
    if (list) {
      list.push(medication);
    } else {
      groups.set(key, [medication]);
    }
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function MedicationsListPage() {
  const medications = useMedications();
  const thresholds = useNotificationThresholds();
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(() => localStorage.getItem(GROUPED_VIEW_KEY) === "1");

  const filtered = useMemo(() => {
    if (!medications) return [];
    return medications.filter((medication) => matchesSearch(medication, search));
  }, [medications, search]);

  // Mentre si cerca, ha senso vedere subito l'elenco piatto dei risultati
  // invece di doverli scovare aprendo i gruppi uno per uno.
  const showGrouped = grouped && !search;
  const groups = useMemo(
    () => (showGrouped ? groupByIndication(filtered) : []),
    [showGrouped, filtered],
  );

  function handleToggleGrouped(next: boolean) {
    setGrouped(next);
    localStorage.setItem(GROUPED_VIEW_KEY, next ? "1" : "0");
  }

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

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={grouped}
          onChange={(e) => handleToggleGrouped(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300"
        />
        Raggruppa per uso (collassabile)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {medications === null && <p className="text-sm text-stone-500">Caricamento…</p>}

      {medications !== null && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          {medications.length === 0
            ? "Nessun farmaco censito. Aggiungine uno per iniziare."
            : "Nessun farmaco corrisponde alla ricerca."}
        </p>
      )}

      {!showGrouped && (
        <ul className="space-y-2">
          {filtered.map((medication) => (
            <MedicationListItem key={medication.id} medication={medication} thresholds={thresholds} />
          ))}
        </ul>
      )}

      {showGrouped && (
        <div className="space-y-3">
          {groups.map(([group, items]) => (
            <details key={group} className="group rounded-2xl border-2 border-stone-400 bg-white shadow-md">
              <summary className="cursor-pointer select-none list-none px-4 py-3 font-medium text-stone-800 marker:content-none">
                <span className="mr-2 inline-block transition-transform group-open:rotate-90">▶</span>
                {group}
                <span className="ml-2 text-sm font-normal text-stone-500">({items.length})</span>
              </summary>
              <ul className="space-y-2 border-t border-stone-200 p-3">
                {items.map((medication) => (
                  <MedicationListItem
                    key={medication.id}
                    medication={medication}
                    thresholds={thresholds}
                  />
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

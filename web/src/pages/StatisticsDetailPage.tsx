import { Link, useSearchParams } from "react-router-dom";
import { MedicationListItem } from "../components/MedicationListItem";
import { useMedications } from "../lib/medications";
import {
  filterMedicationsByPerson,
  filterMedicationsByStat,
  STAT_FILTER_LABELS,
  type StatFilterKey,
} from "../lib/medicationStatus";
import { useNotificationThresholds } from "../lib/notificationThresholds";

function isStatFilterKey(value: string | null): value is StatFilterKey {
  return !!value && value in STAT_FILTER_LABELS;
}

export function StatisticsDetailPage() {
  const [searchParams] = useSearchParams();
  const medications = useMedications();
  const thresholds = useNotificationThresholds();

  const filterParam = searchParams.get("filter");
  const personParam = searchParams.get("person");

  if (medications === null) {
    return <p className="text-sm text-stone-500">Caricamento…</p>;
  }

  let title: string;
  let items: typeof medications;

  if (personParam) {
    title = `Farmaci per ${personParam}`;
    items = filterMedicationsByPerson(medications, personParam);
  } else if (isStatFilterKey(filterParam)) {
    title = STAT_FILTER_LABELS[filterParam];
    items = filterMedicationsByStat(medications, filterParam, thresholds);
  } else {
    return (
      <div className="space-y-4">
        <p className="rounded-2xl border-2 border-stone-400 bg-white p-8 text-center text-sm text-stone-500 shadow-md">
          Filtro non riconosciuto.
        </p>
        <Link
          to="/statistiche"
          className="inline-flex items-center rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          ← Torna alle statistiche
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to="/statistiche"
        className="inline-flex items-center rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
      >
        ← Torna alle statistiche
      </Link>

      <h1 className="text-xl font-semibold text-stone-800">
        {title} <span className="font-normal text-stone-500">({items.length})</span>
      </h1>

      {items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Nessun farmaco corrisponde a questo criterio.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((medication) => (
          <MedicationListItem key={medication.id} medication={medication} thresholds={thresholds} />
        ))}
      </ul>
    </div>
  );
}

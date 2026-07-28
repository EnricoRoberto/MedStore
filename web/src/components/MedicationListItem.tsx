import { Link } from "react-router-dom";
import { QuantityBar } from "./QuantityBar";
import { getMedicationBadge } from "../lib/medicationStatus";
import type { NotificationThresholds } from "../lib/notificationThresholds";
import type { Medication } from "../types/medication";

export function MedicationListItem({
  medication,
  thresholds,
}: {
  medication: Medication;
  thresholds: NotificationThresholds;
}) {
  const badge = medication.status === "active" ? getMedicationBadge(medication, thresholds) : null;

  return (
    <li>
      <Link
        to={`/farmaci/${medication.id}`}
        className="block rounded-2xl border-2 border-stone-400 bg-white p-4 shadow-md hover:border-terracotta-400 hover:shadow-lg"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-stone-800">
              {medication.name}
              {medication.requiresRefrigeration && (
                <span className="ml-2" title="Conservare in frigorifero">
                  🌡️❄️
                </span>
              )}
              {medication.status === "archived" && (
                <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-500">
                  Archiviato
                </span>
              )}
              {badge && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    badge.tone === "red" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
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
}

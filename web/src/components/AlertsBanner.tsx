import { Link } from "react-router-dom";
import { daysUntil } from "../lib/dates";
import { useMedications } from "../lib/medications";
import { isExhausted, isLowStock } from "../lib/medicationStatus";
import { useNotificationThresholds } from "../lib/notificationThresholds";

// Nessuna Cloud Function schedulata né notifiche push: l'avviso viene
// ricalcolato dal vivo ogni volta che l'app è aperta, sulle stesse soglie
// configurabili in config/notificationThresholds.
export function AlertsBanner() {
  const medications = useMedications();
  const thresholds = useNotificationThresholds();

  if (!medications) return null;

  const active = medications.filter((m) => m.status === "active");
  const expiring = active.filter(
    (m) => m.expirationDate && daysUntil(m.expirationDate) <= thresholds.expiringWithinDays,
  );
  const exhausted = active.filter((m) => isExhausted(m, thresholds));
  const low = active.filter((m) => isLowStock(m, thresholds));

  if (expiring.length === 0 && exhausted.length === 0 && low.length === 0) {
    return null;
  }

  const parts: string[] = [];
  if (expiring.length > 0) parts.push(`${expiring.length} in scadenza`);
  if (exhausted.length > 0) parts.push(`${exhausted.length} esauriti`);
  if (low.length > 0) parts.push(`${low.length} con scorta bassa`);

  return (
    <Link
      to="/"
      className="block border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800 hover:bg-amber-100"
    >
      ⚠️ {parts.join(" · ")} — controlla l'inventario
    </Link>
  );
}

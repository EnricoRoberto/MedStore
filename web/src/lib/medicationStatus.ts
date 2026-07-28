import { daysUntil } from "./dates";
import type { NotificationThresholds } from "./notificationThresholds";
import type { Medication } from "../types/medication";

export function isExpired(medication: Medication): boolean {
  return !!medication.expirationDate && daysUntil(medication.expirationDate) < 0;
}

export function isExpiringSoon(
  medication: Medication,
  thresholds: NotificationThresholds,
): boolean {
  if (!medication.expirationDate) return false;
  const days = daysUntil(medication.expirationDate);
  return days >= 0 && days <= thresholds.expiringWithinDays;
}

export function isExhausted(medication: Medication, thresholds: NotificationThresholds): boolean {
  return medication.quantityPercent <= thresholds.exhaustedPercent;
}

export function isLowStock(medication: Medication, thresholds: NotificationThresholds): boolean {
  const minThreshold = medication.minQuantityPercent ?? thresholds.lowQuantityPercent;
  return medication.quantityPercent > thresholds.exhaustedPercent
    && medication.quantityPercent <= minThreshold;
}

export interface MedicationBadge {
  label: string;
  tone: "red" | "amber";
}

// Un solo badge per farmaco, con priorità alla scadenza rispetto alla
// scorta quando entrambe si applicano (richiesta esplicita dell'utente).
export function getMedicationBadge(
  medication: Medication,
  thresholds: NotificationThresholds,
): MedicationBadge | null {
  if (isExpired(medication)) return { label: "Scaduto", tone: "red" };
  if (isExpiringSoon(medication, thresholds)) return { label: "In scadenza", tone: "amber" };
  if (isExhausted(medication, thresholds)) return { label: "Esaurito", tone: "red" };
  if (isLowStock(medication, thresholds)) return { label: "Scorta bassa", tone: "amber" };
  return null;
}

export type StatFilterKey =
  | "active"
  | "archived"
  | "otc"
  | "prescription"
  | "expiringSoon"
  | "expired"
  | "low"
  | "exhausted";

export const STAT_FILTER_LABELS: Record<StatFilterKey, string> = {
  active: "Farmaci in uso",
  archived: "Farmaci archiviati",
  otc: "Farmaci da banco",
  prescription: "Farmaci con ricetta",
  expiringSoon: "Farmaci in scadenza",
  expired: "Farmaci scaduti",
  low: "Farmaci con scorta bassa",
  exhausted: "Farmaci esauriti",
};

// Stessa logica di filtro usata per i conteggi in Statistiche, riusata anche
// per la pagina di dettaglio aperta cliccando un riquadro: un'unica fonte di
// verità evita che i due punti si disallineino nel tempo.
export function filterMedicationsByStat(
  medications: Medication[],
  key: StatFilterKey,
  thresholds: NotificationThresholds,
): Medication[] {
  const active = medications.filter((m) => m.status === "active");
  switch (key) {
    case "active":
      return active;
    case "archived":
      return medications.filter((m) => m.status === "archived");
    case "otc":
      return active.filter((m) => !m.requiresPrescription);
    case "prescription":
      return active.filter((m) => m.requiresPrescription);
    case "expiringSoon":
      return active.filter((m) => isExpiringSoon(m, thresholds));
    case "expired":
      return active.filter((m) => isExpired(m));
    case "low":
      return active.filter((m) => isLowStock(m, thresholds));
    case "exhausted":
      return active.filter((m) => isExhausted(m, thresholds));
  }
}

export function filterMedicationsByPerson(medications: Medication[], person: string): Medication[] {
  return medications.filter((m) => m.status === "active" && m.tags.includes(person));
}

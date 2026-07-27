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

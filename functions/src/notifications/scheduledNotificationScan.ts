import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

interface NotificationThresholds {
  expiringWithinDays: number;
  lowQuantityPercent: number;
  exhaustedPercent: number;
}

const DEFAULT_THRESHOLDS: NotificationThresholds = {
  expiringWithinDays: 30,
  lowQuantityPercent: 20,
  exhaustedPercent: 5,
};

interface NotificationState {
  expiringNotified: boolean;
  lowQuantityNotified: boolean;
  exhaustedNotified: boolean;
}

const DEFAULT_NOTIFICATION_STATE: NotificationState = {
  expiringNotified: false,
  lowQuantityNotified: false,
  exhaustedNotified: false,
};

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00Z`);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((target.getTime() - todayUtc) / (1000 * 60 * 60 * 24));
}

// Ogni condizione (scadenza/quantità bassa/esaurito) viene notificata una sola
// volta finché resta vera; il flag si azzera da solo quando la condizione
// rientra (farmaco rifornito, data di scadenza aggiornata, ecc.), permettendo
// una nuova notifica in futuro senza spam quotidiano.
export const scheduledNotificationScan = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Europe/Rome", region: "europe-west1" },
  async () => {
    const db = getFirestore();

    const [thresholdsDoc, tokensSnap, medicationsSnap] = await Promise.all([
      db.collection("config").doc("notificationThresholds").get(),
      db.collection("fcmTokens").get(),
      db.collection("medications").where("status", "==", "active").get(),
    ]);

    const thresholds: NotificationThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...(thresholdsDoc.data() as Partial<NotificationThresholds> | undefined),
    };

    const tokens = tokensSnap.docs.map((tokenDoc) => tokenDoc.id);
    if (tokens.length === 0) {
      return;
    }

    const batch = db.batch();
    let hasUpdates = false;

    for (const medicationDoc of medicationsSnap.docs) {
      const medication = medicationDoc.data();
      const state: NotificationState = {
        ...DEFAULT_NOTIFICATION_STATE,
        ...(medication.notificationState as Partial<NotificationState> | undefined),
      };
      const nextState = { ...state };
      const messages: { title: string; body: string }[] = [];

      const isExhausted = medication.quantityPercent <= thresholds.exhaustedPercent;
      const isLow = !isExhausted && medication.quantityPercent <= thresholds.lowQuantityPercent;
      const expirationDate = medication.expirationDate as string | null | undefined;
      const isExpiring =
        !!expirationDate && daysUntil(expirationDate) <= thresholds.expiringWithinDays;

      if (isExhausted && !state.exhaustedNotified) {
        messages.push({ title: "Farmaco esaurito", body: `${medication.name} risulta esaurito.` });
        nextState.exhaustedNotified = true;
      } else if (!isExhausted) {
        nextState.exhaustedNotified = false;
      }

      if (isLow && !state.lowQuantityNotified) {
        messages.push({
          title: "Scorta in esaurimento",
          body: `${medication.name}: quantità residua al ${medication.quantityPercent}%.`,
        });
        nextState.lowQuantityNotified = true;
      } else if (!isLow) {
        nextState.lowQuantityNotified = false;
      }

      if (isExpiring && expirationDate && !state.expiringNotified) {
        const remaining = daysUntil(expirationDate);
        messages.push({
          title: "Farmaco in scadenza",
          body:
            remaining < 0
              ? `${medication.name} è scaduto.`
              : `${medication.name} scade tra ${remaining} giorni.`,
        });
        nextState.expiringNotified = true;
      } else if (!isExpiring) {
        nextState.expiringNotified = false;
      }

      for (const message of messages) {
        const response = await getMessaging().sendEachForMulticast({
          tokens,
          notification: message,
        });
        response.responses.forEach((result, index) => {
          if (!result.success && result.error && INVALID_TOKEN_ERROR_CODES.has(result.error.code)) {
            batch.delete(db.collection("fcmTokens").doc(tokens[index]));
            hasUpdates = true;
          }
        });
      }

      if (
        nextState.exhaustedNotified !== state.exhaustedNotified ||
        nextState.lowQuantityNotified !== state.lowQuantityNotified ||
        nextState.expiringNotified !== state.expiringNotified
      ) {
        batch.update(medicationDoc.ref, {
          notificationState: nextState,
          notificationStateUpdatedAt: FieldValue.serverTimestamp(),
        });
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await batch.commit();
    }
  },
);

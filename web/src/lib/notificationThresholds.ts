import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

export interface NotificationThresholds {
  expiringWithinDays: number;
  lowQuantityPercent: number;
  exhaustedPercent: number;
}

const DEFAULT_THRESHOLDS: NotificationThresholds = {
  expiringWithinDays: 30,
  lowQuantityPercent: 20,
  exhaustedPercent: 5,
};

export function useNotificationThresholds(): NotificationThresholds {
  const [thresholds, setThresholds] = useState<NotificationThresholds>(DEFAULT_THRESHOLDS);

  useEffect(() => {
    return onSnapshot(doc(db, "config", "notificationThresholds"), (snapshot) => {
      const data = snapshot.data();
      setThresholds({
        expiringWithinDays: data?.expiringWithinDays ?? DEFAULT_THRESHOLDS.expiringWithinDays,
        lowQuantityPercent: data?.lowQuantityPercent ?? DEFAULT_THRESHOLDS.lowQuantityPercent,
        exhaustedPercent: data?.exhaustedPercent ?? DEFAULT_THRESHOLDS.exhaustedPercent,
      });
    });
  }, []);

  return thresholds;
}

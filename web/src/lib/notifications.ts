import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db, firebaseConfig } from "./firebase";

export type NotificationSetupResult = "granted" | "denied" | "unsupported";

export async function enablePushNotifications(uid: string): Promise<NotificationSetupResult> {
  if (!(await isSupported())) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return "denied";
  }

  const swParams = new URLSearchParams(
    Object.entries(firebaseConfig).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = String(value ?? "");
      return acc;
    }, {}),
  );
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swParams.toString()}`,
  );

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  await setDoc(
    doc(db, "fcmTokens", token),
    {
      uid,
      token,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  return "granted";
}

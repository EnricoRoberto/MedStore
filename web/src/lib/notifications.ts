import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db } from "./firebase";
import { registerServiceWorker } from "./serviceWorker";

export type NotificationSetupResult = "granted" | "denied" | "unsupported";

export async function enablePushNotifications(uid: string): Promise<NotificationSetupResult> {
  if (!(await isSupported())) {
    return "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return "denied";
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return "unsupported";
  }

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

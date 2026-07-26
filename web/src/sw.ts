/// <reference lib="webworker" />
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// La config Firebase arriva via querystring dell'URL di registrazione: questo
// service worker non passa dalla pipeline di build di Vite lato app e non
// può leggere import.meta.env (le chiavi web di Firebase non sono segrete,
// sono protette dalle security rules, quindi esporle nell'URL è sicuro).
const params = new URLSearchParams(self.location.search);
const app = initializeApp({
  apiKey: params.get("apiKey") ?? undefined,
  authDomain: params.get("authDomain") ?? undefined,
  projectId: params.get("projectId") ?? undefined,
  storageBucket: params.get("storageBucket") ?? undefined,
  messagingSenderId: params.get("messagingSenderId") ?? undefined,
  appId: params.get("appId") ?? undefined,
});

const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? "MedStore";
  const body = payload.notification?.body ?? "";
  void self.registration.showNotification(title, { body, icon: "/icon-192.png" });
});

// Service worker dedicato a Firebase Cloud Messaging (notifiche push in
// background). La configurazione Firebase arriva via querystring perché
// questo file, servito da public/, non passa dalla pipeline di build di
// Vite e non può leggere import.meta.env.
//
// Nota: in M9 questo service worker verrà unificato con quello della PWA
// (vite-plugin-pwa in modalità injectManifest) per farli convivere.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "MedStore";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, { body });
});

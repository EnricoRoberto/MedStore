import { firebaseConfig } from "./firebase";

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration> | null {
  // In `vite dev` non esiste un /sw.js reale (viene generato solo in build);
  // richiederlo farebbe fallire la registrazione con l'HTML di fallback della SPA.
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return null;
  }
  if (!registrationPromise) {
    const params = new URLSearchParams(
      Object.entries(firebaseConfig).reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = String(value ?? "");
        return acc;
      }, {}),
    );
    registrationPromise = navigator.serviceWorker.register(`/sw.js?${params.toString()}`);
  }
  return registrationPromise;
}

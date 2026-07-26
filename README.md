# MedStore

Web app per raccogliere, classificare e tenere in inventario le confezioni di farmaci di casa tramite foto da smartphone, con classificazione assistita da IA (Vertex AI in Firebase / Gemini), storicizzazione periodica dell'inventario, notifiche di scadenza/quantità e log delle modifiche.

## Struttura del progetto

- `web/` — frontend React + TypeScript + Vite (PWA), Firebase Auth/Firestore/Storage/Messaging via SDK client.
- `functions/` — Cloud Functions (TypeScript) per classificazione foto (Gemini), enforcement whitelist, audit log, notifiche schedulate.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `storage.rules` — configurazione Firebase condivisa.

## Sviluppo locale

```bash
# frontend
cd web && npm install && npm run dev

# functions (in un altro terminale)
cd functions && npm install && npm run build:watch

# emulatori Firebase (dalla root)
npx firebase-tools emulators:start
```

Copia `web/.env.example` in `web/.env.local` e compila i valori con quelli del tuo progetto Firebase (vedi sotto).

## Setup manuale del progetto Firebase (una tantum)

Questi passi vanno fatti manualmente in console — non sono automatizzabili da codice:

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com).
2. Effettua l'upgrade al piano **Blaze** (richiesto da Cloud Functions gen2, funzioni schedulate e Vertex AI).
3. Abilita **Vertex AI in Firebase** (Build → Vertex AI → Get started).
4. Abilita **Authentication** e attiva il provider **Google**.
5. Abilita **Firestore** e **Storage** (stessa region, es. `europe-west1`).
6. Abilita le API **Cloud Scheduler** e **Cloud Functions** su Google Cloud Console.
7. In Project Settings → Service accounts, genera una nuova chiave privata JSON (ruoli: Firebase Admin, Cloud Functions Admin, Cloud Scheduler Admin, Service Account User, Vertex AI User).
8. Aggiungi la chiave come secret GitHub `FIREBASE_SERVICE_ACCOUNT` (Settings → Secrets and variables → Actions del repository).
9. Aggiungi l'ID progetto come secret GitHub `FIREBASE_PROJECT_ID`, e sostituiscilo anche in `.firebaserc`.
10. Registra una **Web App** in Project Settings → Your apps per ottenere i valori di `firebaseConfig`; aggiungili come secret GitHub `VITE_FIREBASE_*` (vedi `web/.env.example`) e nel tuo `.env.local` locale.
11. Genera una chiave **VAPID** (Project Settings → Cloud Messaging → Web configuration) per le notifiche push; aggiungila come secret `VITE_FIREBASE_VAPID_KEY`.
12. Aggiungi manualmente in Firestore (console) un documento per ogni email autorizzata nella collezione `allowlist` (es. `{ email: "nome@gmail.com", active: true }`) — le scritture su questa collezione sono bloccate lato client per sicurezza.
13. Verifica che il dominio di Hosting sia nei domini autorizzati per l'autenticazione (Authentication → Settings → Authorized domains).
14. (Opzionale) Per cambiare le soglie di notifica di default (scadenza entro 30gg, quantità bassa ≤20%, esaurita ≤5%), crea in Firestore il documento `config/notificationThresholds` con i campi `expiringWithinDays`, `lowQuantityPercent`, `exhaustedPercent`.

Una volta completati questi passi, ogni push su `main` esegue automaticamente build e deploy tramite GitHub Actions (`.github/workflows/deploy.yml`).

Nota: `web/public/icon-192.png` e `icon-512.png` sono placeholder a tinta unita (per rendere installabile la PWA da subito) — sostituiscili con l'icona reale dell'app quando disponibile.

## Milestone di sviluppo

- [x] M1 — Scaffold repo, config Firebase, CI
- [x] M2 — Auth (Google Sign-In) + whitelist (custom claim `allowlisted`) + shell/routing + guida
- [x] M3 — CRUD farmaci, ricerca, barra quantità, change log
- [x] M4 — Wizard foto con classificazione stub (inserimento manuale)
- [x] M5 — Classificazione reale con Gemini (Vertex AI in Firebase) + conferma manuale
- [x] M6 — Storicizzazione inventario
- [x] M7 — Notifiche push (FCM) + funzione schedulata
- [x] M8 — Pagina statistiche/report
- [x] M9 — Rifinitura PWA, manuale utente completo, hardening CI/rules

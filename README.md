# MedStore

Web app per raccogliere, classificare e tenere in inventario le confezioni di farmaci di casa tramite foto da smartphone, con classificazione assistita da IA (Gemini), storicizzazione periodica dell'inventario, avvisi di scadenza/quantità e log delle modifiche.

Architettura pensata per restare **sempre gratuita** (piano Firebase Spark): nessuna Cloud Function, nessun Cloud Storage, nessun servizio a pagamento. La logica che altrove richiederebbe un backend (whitelist, audit log, classificazione IA) gira lato client, appoggiandosi solo a Firestore Security Rules e a una chiamata diretta alla Gemini Developer API. Le foto vengono ridimensionate/compresse nel browser e salvate come stringa base64 dentro i documenti Firestore, invece che su Cloud Storage — che dal 2024 richiede il piano Blaze (a pagamento) anche solo per pubblicarne le security rules.

## Struttura del progetto

- `web/` — frontend React + TypeScript + Vite (PWA), Firebase Auth/Firestore via SDK client.
- `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` — configurazione Firebase condivisa.

## Sviluppo locale

```bash
cd web && npm install && npm run dev

# emulatori Firebase (dalla root, opzionale)
npx firebase-tools emulators:start
```

Copia `web/.env.example` in `web/.env.local` e compila i valori con quelli del tuo progetto Firebase e la tua API key Gemini (vedi sotto).

## Setup manuale del progetto Firebase (una tantum)

Questi passi vanno fatti manualmente in console — non sono automatizzabili da codice. Il piano **Spark (gratuito)** è sufficiente, non serve upgrade a pagamento.

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com).
2. Abilita **Authentication** e attiva il provider **Google**.
3. Abilita **Firestore** (Storage non serve: le foto sono salvate come base64 in Firestore).
4. Registra una **Web App** in Project Settings → Your apps per ottenere i valori di `firebaseConfig`; aggiungili come secret GitHub `VITE_FIREBASE_*` (vedi `web/.env.example`) e nel tuo `.env.local` locale.
5. Aggiungi l'ID progetto come secret GitHub `FIREBASE_PROJECT_ID`, e sostituiscilo anche in `.firebaserc`.
6. In Project Settings → Service accounts, genera una chiave privata JSON con i ruoli Firebase Hosting Admin e Cloud Datastore/Firestore Rules Admin (solo per far girare `firebase deploy` da GitHub Actions — non serve alcun servizio a pagamento). Aggiungila come secret GitHub `FIREBASE_SERVICE_ACCOUNT`.
7. Crea una API key per la **Gemini Developer API** su [Google AI Studio](https://aistudio.google.com/apikey) (gratuita entro i limiti di utilizzo per l'uso familiare previsto). In Google Cloud Console → Credentials, vincola la chiave:
   - per API: solo **Generative Language API**;
   - per referrer HTTP: solo il dominio di Hosting (es. `https://<progetto>.web.app/*`) e `http://localhost:*` per lo sviluppo locale.
   Aggiungila come secret GitHub `VITE_GEMINI_API_KEY` e nel tuo `.env.local` locale.
8. Aggiungi manualmente in Firestore (console) un documento per ogni email autorizzata nella collezione `allowlist` (es. `{ email: "nome@gmail.com", active: true }`) — le scritture su questa collezione sono bloccate lato client, la whitelist è verificata dalle security rules.
9. Verifica che il dominio di Hosting sia nei domini autorizzati per l'autenticazione (Authentication → Settings → Authorized domains).
10. (Opzionale) Per cambiare le soglie di avviso di default (scadenza entro 30gg, quantità bassa ≤20%, esaurita ≤5%), crea in Firestore il documento `config/notificationThresholds` con i campi `expiringWithinDays`, `lowQuantityPercent`, `exhaustedPercent`.

Una volta completati questi passi, ogni push su `main` esegue automaticamente build e deploy tramite GitHub Actions (`.github/workflows/deploy.yml`).

Nota: `web/public/icon-192.png` e `icon-512.png` sono placeholder a tinta unita (per rendere installabile la PWA da subito) — sostituiscili con l'icona reale dell'app quando disponibile.

### Nota sulla API key lato client

La API key Gemini è incorporata nel bundle JavaScript pubblico (necessario per chiamare l'API direttamente dal browser, senza un backend a pagamento). Le restrizioni per referrer HTTP e per API impediscono che venga riutilizzata da altri siti o per altre API, ma restano un compromesso accettato per garantire zero costi fissi — è la stessa logica di scambio già descritta più sopra sull'architettura.

## Milestone di sviluppo

- [x] M1 — Scaffold repo, config Firebase, CI
- [x] M2 — Auth (Google Sign-In) + whitelist (verificata via Firestore rules) + shell/routing + guida
- [x] M3 — CRUD farmaci, ricerca, barra quantità, change log (scritto dal client)
- [x] M4 — Wizard foto con classificazione stub (inserimento manuale)
- [x] M5 — Classificazione reale con Gemini (Developer API, chiamata diretta dal client) + conferma manuale
- [x] M6 — Storicizzazione inventario
- [x] M7 — Avvisi di scadenza/quantità in-app (nessuna notifica push, nessuna funzione schedulata)
- [x] M8 — Pagina statistiche/report
- [x] M9 — Rifinitura PWA, manuale utente completo, hardening rules
- [x] Rimozione delle Cloud Functions per restare sul piano Firebase gratuito

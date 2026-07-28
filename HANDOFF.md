# MedStore — Contesto di sessione (handoff per nuova chat)

> File generato per permettere di ripartire in una nuova sessione Claude Code
> senza perdere il contesto e il lavoro svolto finora. Ultimo aggiornamento:
> 2026-07-28, dopo il merge della PR #14.

## Cos'è MedStore

PWA React + TypeScript + Vite per censire e tenere sotto controllo le scatole
di farmaci in casa: chi le usa, a cosa servono, se richiedono ricetta, quanto
ne resta, scadenze. Hostata su Firebase (Hosting + Firestore + Auth), con
classificazione automatica delle confezioni tramite foto e Gemini AI.

## Stack tecnico

- **Frontend**: React + TypeScript + Vite, Tailwind CSS (tema custom
  crema/terracotta/salvia, font Nunito/Quicksand), React Router v6.
- **Backend**: nessuno — solo Firebase lato client.
  - **Firestore**: unico datastore, incluse le foto salvate come **base64**
    dentro i documenti (per restare sul piano gratuito Spark, evitando Cloud
    Storage a pagamento).
  - **Firebase Auth**: Google Sign-In, con gate `isAllowlisted()` nelle
    security rules (solo familiari autorizzati in whitelist).
  - **Firebase Hosting**: deploy statico del build Vite.
  - **Nessuna Cloud Function**: rimosse esplicitamente per restare sul piano
    gratuito.
- **AI**: Gemini Developer API (`@google/generative-ai`), chiamata
  client-side, modello alias `gemini-flash-latest` (non pinnato a una
  versione fissa, per non doverlo aggiornare manualmente).
- **CI/CD**: due GitHub Actions workflow separati, entrambi su push a `main`:
  - `.github/workflows/ci.yml` → job "CI" (build + lint + test)
  - `.github/workflows/deploy.yml` → job "Deploy" (deploy su Firebase Hosting)

## Repository e branch

- Repo: `EnricoRoberto/MedStore` (GitHub MCP tools scoped su
  `enricoroberto/medstore`).
- Branch di lavoro: `claude/medstore-m1-setup-84gnvj` (unico branch feature,
  riusato per ogni nuova funzionalità).
- Le PR vengono **squash-mergiate** su `main`. Prima di ogni nuovo commit, se
  il branch è divergente da `origin/main`, va rebasato:
  ```bash
  git fetch origin main
  git stash -u
  git reset --hard origin/main
  git stash pop
  # risolvere eventuali conflitti, poi:
  git push --force-with-lease
  ```
  ATTENZIONE: `git reset --hard` scarta anche i file nuovi (mai committati)
  presenti nell'albero di lavoro/index — non usarlo con file appena creati
  ancora da salvare, oppure rifarli dopo il reset.

## Processo di lavoro standard (autonomo, già autorizzato dall'utente)

Per ogni nuova richiesta di modifica/feature:

1. Implementare direttamente per richieste oggettive/minori. Usare
   `AskUserQuestion` solo per decisioni di design genuinamente ambigue o
   soggettive.
2. Prima di committare, sempre:
   ```bash
   npm run build
   npx eslint src --ext .ts,.tsx
   ```
   (eseguire dentro `web/`)
3. Rebase su `origin/main` se divergente (vedi sopra).
4. Commit con messaggio chiaro, push sul branch feature.
5. Aprire una PR (`create_pull_request`), **subscribe_pr_activity** per
   monitorare CI/review.
6. Aspettare che la CI sia verde (`get_check_runs`), verificare zero commenti
   di review non risolti (`get_review_comments`).
7. **Merge con squash** (`merge_pull_request`).
8. Verificare che il workflow "Deploy" auto-triggerato su `main` completi con
   successo (`actions_get` → `get_workflow_run`, controllare sia il run "CI"
   sia quello "Deploy" per il commit di merge).
9. Riportare all'utente in modo conciso quando il deploy è confermato live.

Tutto questo va fatto **autonomamente**, senza chiedere conferma ad ogni
passaggio (autorizzazione "fai tutto da solo" già data dall'utente in questa
sessione).

### Nota tecnica su `actions_list`

Il parametro `workflow_runs_filter` di `mcp__github__actions_list` non
riduce sempre in modo affidabile la dimensione dei risultati per questo
repo (può restituire dump da 300k+ caratteri anche filtrato). Workaround
funzionante: lasciare che il tool salvi l'output su file, poi usare Bash +
Python per leggere/slice il file e cercare con regex lo `head_sha` del
commit di interesse vicino a un confine `{"id":...}`, invece di
ri-interrogare cambiando parametri di paginazione.

## Vincoli importanti

- **Scope GitHub**: le tool GitHub in questa sessione sono limitate a
  `enricoroberto/medstore`. Non leggere/scrivere/cercare in altri repo a
  meno che non vengano aggiunti esplicitamente con `add_repo`.
- **Identità modello**: non includere mai l'identificativo del modello
  (es. `claude-sonnet-5`) in commit, titoli/corpi di PR o commenti nel
  codice — solo nelle risposte in chat.
- **PR**: non creare PR a meno che l'utente non lo chieda esplicitamente
  (ma per questa sessione l'autorizzazione a fare tutto autonomamente,
  incluse le PR, è già stata data).

## Funzionalità implementate finora (PR #1 → #14)

In ordine cronologico (titoli reali dei commit di merge):

1. **#1** — Scaffold completo MedStore (M1–M9): setup iniziale progetto,
   Firebase, struttura base.
2. **#2** — Rimozione Cloud Functions (piano Spark gratuito).
3. **#3** — Rimozione Cloud Storage: foto salvate come base64 in Firestore.
4. **#4** — Aggiornamento modello Gemini a `gemini-2.5-flash`.
5. **#5** — Uso dell'alias `gemini-flash-latest` invece di una versione
   fissa.
6. **#6** — Restyling "caldo/casalingo" (palette crema/terracotta/salvia,
   font Nunito/Quicksand, logo croce farmacia), eliminazione farmaci
   (singola + svuota tutto, con conferma), foto aggiuntive con
   affinamento IA, report inventario condivisibile (WhatsApp/email).
7. **#7** — Eliminazione delle sessioni di inventario (singola + svuota
   tutto).
8. **#8** — Migliora la formattazione del report inventario.
9. **#9** — Scorta minima desiderata personalizzata per singolo farmaco.
10. **#10** — Badge scadenza/scorta bassa sul singolo farmaco (priorità:
    scaduto > in scadenza > esaurito > scorta bassa), foto del wizard
    collegate permanentemente alla scheda del farmaco.
11. **#11** — Foto d'insieme multiple nel wizard, overview per confezione,
    rianalisi IA per singola confezione senza duplicati.
12. **#12** — Fix UX flusso di conferma (il pannello resta aperto dopo il
    salvataggio, evitando di mostrare il farmaco sbagliato), card delle
    liste rese più marcate (bordi/ombre, iterato due volte).
13. **#13 (a0a2b27)** — Farmaci raggruppabili per uso/indicazione (tramite
    `<details>` collassabili con stato persistito in `localStorage`),
    icona 🌡️❄️ per farmaci da conservare in frigorifero, indicatore utenti
    online (presenza via heartbeat Firestore).
14. **#14 (0af622d)** — **Riquadri statistiche cliccabili con pagina di
    dettaglio filtrata** (ultima feature completata, vedi sotto).

### Dettaglio feature #14 (l'ultima consegnata)

Richiesta utente: cliccando su un riquadro nella pagina Statistiche, si apre
una pagina con l'elenco esatto dei farmaci che concorrono a quel numero
(es. "Farmaci esauriti: 5" → lista di quei 5 farmaci), ciascuno cliccabile
per il dettaglio, con un pulsante "indietro" che torna **sempre** e in modo
deterministico alla pagina Statistiche (non `history.back()`).

File coinvolti:

- **`web/src/lib/medicationStatus.ts`** — logica centralizzata di filtro,
  per evitare una terza duplicazione della logica delle soglie (già
  successo due volte tra `AlertsBanner` e `StatisticsPage`):
  - `StatFilterKey` (union type: `active | archived | otc | prescription |
    expiringSoon | expired | low | exhausted`)
  - `STAT_FILTER_LABELS` (etichette italiane per ciascuna chiave)
  - `filterMedicationsByStat(medications, key, thresholds)` — restituisce
    esattamente i farmaci che contribuiscono a quella statistica.
  - `filterMedicationsByPerson(medications, person)` — farmaci attivi
    taggati con una persona.
- **`web/src/components/StatCard.tsx`** — riscritta per accettare un prop
  opzionale `to?: string`: se presente renderizza un `<Link>`, altrimenti
  un `<div>`. Toni colore (`default`/`amber`/`red`/`emerald`) con
  `border-2 ... shadow-md`, più `hover:shadow-lg` quando cliccabile.
- **`web/src/pages/StatisticsPage.tsx`** — i conteggi ora usano
  `filterMedicationsByStat(...).length` invece di predicati inline
  duplicati; ogni `StatCard` ha un `to` verso
  `/statistiche/dettaglio?filter=<key>` (o `/inventario` per le sessioni);
  la lista "Farmaci per persona" usa
  `/statistiche/dettaglio?person=<encoded>`.
- **`web/src/pages/StatisticsDetailPage.tsx`** (nuovo file) — legge
  `?filter=` o `?person=` da `useSearchParams()`, applica il filtro
  condiviso, mostra `<MedicationListItem>` per ciascun farmaco, gestisce
  stato vuoto e chiave filtro non riconosciuta. Link
  "← Torna alle statistiche" verso `/statistiche` (deterministico, non
  `navigate(-1)`).
- **`web/src/App.tsx`** — nuova route
  `<Route path="statistiche/dettaglio" element={<StatisticsDetailPage />} />`.
- **`web/src/pages/HelpPage.tsx`** — aggiunto un paragrafo nella sezione
  "Statistiche" che spiega la nuova interazione.

Stato: **PR #14 mergiata** (squash, commit `0af622d27593093eecac5fda3c4c8a3351e25d9c`),
sia il workflow **CI** che il workflow **Deploy** hanno completato con
`status: completed`, `conclusion: success`. Deploy confermato live.

## File chiave da conoscere (mappa rapida)

- `web/src/lib/medicationStatus.ts` — tutta la logica di stato/soglie di un
  farmaco (scaduto, in scadenza, scorta bassa, esaurito, badge, filtri
  statistiche). **Punto centrale**: qualsiasi nuova logica di
  filtro/soglia va aggiunta qui, non duplicata altrove.
- `web/src/lib/notificationThresholds.ts` — tipo/gestione delle soglie di
  notifica configurabili (scadenza, scorta bassa, esaurito).
- `web/src/components/StatCard.tsx` — riquadro statistica riusabile
  (cliccabile o no).
- `web/src/components/MedicationListItem.tsx` — riga farmaco riusata in
  più liste (elenco principale, dettaglio statistiche, ecc.), con badge,
  icona frigo, barra quantità.
- `web/src/pages/StatisticsPage.tsx` / `StatisticsDetailPage.tsx` — pagina
  statistiche e relativa pagina di dettaglio filtrato.
- `web/src/pages/HelpPage.tsx` — guida utente in-app, da tenere aggiornata
  ad ogni nuova feature visibile all'utente.
- `web/src/App.tsx` — definizione di tutte le route.

## Prossimi passi / task pendenti

Nessuna richiesta funzionale esplicita è al momento in sospeso: tutte le
feature richieste finora sono state implementate, mergiate e con deploy
verificato. In una nuova sessione, riprendere semplicemente dall'ultima
richiesta dell'utente, seguendo il processo standard descritto sopra.

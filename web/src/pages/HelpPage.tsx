interface Section {
  title: string;
  body: string[];
}

const sections: Section[] = [
  {
    title: "A cosa serve MedStore",
    body: [
      "MedStore aiuta a censire, classificare e tenere sotto controllo le scatole di farmaci presenti in casa: chi le usa, a cosa servono, se richiedono ricetta e quanto ne resta.",
      "L'inventario viene ripetuto periodicamente (es. un paio di volte l'anno) e ogni rilevazione viene storicizzata, così puoi confrontare la situazione nel tempo.",
    ],
  },
  {
    title: "Acquisizione tramite foto",
    body: [
      "Dalla sezione Inventario avvia una nuova sessione, disponi le confezioni su un tavolo e scatta una prima foto d'insieme di tutto il gruppo.",
      "Gira le scatole per mostrare gli altri lati (marca, produttore, data di scadenza) e scatta altre foto dello stesso gruppo.",
      "Premi \"Classifica con IA\" per far analizzare le foto: il sistema individua le confezioni, correla le foto che mostrano la stessa scatola da angolazioni diverse ed estrae produttore, nome, principio attivo, destinazione d'uso, obbligo di ricetta e scadenza, con un livello di confidenza.",
      "Le confezioni con confidenza bassa o non riconosciute restano segnalate: scatta una foto mirata aggiuntiva per quella specifica confezione, oppure classificala e completane i dati manualmente. Puoi anche aggiungere una confezione a mano in qualsiasi momento se l'IA non la individua.",
      "Per ogni confezione classificata, conferma se è un farmaco nuovo o l'aggiornamento di uno già censito (in questo caso ne aggiorna quantità e dati) prima che entri in inventario.",
      "Puoi terminare la sessione in qualsiasi momento, anche con alcune confezioni non completate: resteranno segnalate ma la sessione diventa un riepilogo di sola lettura consultabile in seguito.",
    ],
  },
  {
    title: "Classificazione di ogni farmaco",
    body: [
      "Per ogni farmaco vengono registrati: produttore, nome, principio attivo, destinazione d'uso, obbligo o meno di ricetta medica, e i tag con i nomi delle persone che lo usano.",
      "Puoi correggere questi dati in qualsiasi momento cercando o selezionando il farmaco dalla schermata principale.",
      "Se non è più in casa ma vuoi mantenerne lo storico, impostane lo stato su \"Archiviato\"; se invece vuoi rimuoverlo del tutto, usa \"Elimina farmaco\" nella sua scheda (richiede conferma). Dalla schermata principale puoi anche \"Svuota tutto\" l'inventario in un colpo solo, sempre con conferma: entrambe le azioni non sono reversibili.",
      "Nella scheda di un farmaco già censito puoi aggiungere altre foto (es. il lato con la scadenza leggibile) e premere \"Affina con IA\" per far rileggere i dati al modello e pre-compilare i campi da rivedere prima di salvare, senza dover rifare una sessione di inventario completa.",
    ],
  },
  {
    title: "Giacenza e ricerca",
    body: [
      "Ogni farmaco ha una quantità indicativa da 0% a 100%, mostrata con una barra colorata (verde, giallo sotto il 20%, rosso sotto il 5%) e modificabile manualmente in qualsiasi momento.",
      "Usa la barra di ricerca nella schermata principale per trovare rapidamente un farmaco per nome, produttore, principio attivo o tag, e verificarne la giacenza.",
    ],
  },
  {
    title: "Storico delle modifiche",
    body: [
      "Ogni modifica ai dati di un farmaco (quantità, tag, scadenza, ecc.) viene registrata in un log con data e utente che l'ha effettuata, visibile in fondo alla scheda del farmaco.",
      "La scheda del farmaco mostra anche chi lo ha modificato per ultimo e quando.",
    ],
  },
  {
    title: "Storico degli inventari",
    body: [
      "La sezione Inventario elenca tutte le sessioni di rilevazione svolte nel tempo, in corso o concluse.",
      "Aprendo una sessione conclusa vedi un riepilogo: quanti farmaci nuovi sono stati censiti, quanti aggiornati, e la quantità registrata per ciascuno in quella rilevazione, utile per confrontare la situazione tra un controllo e l'altro.",
      "Puoi eliminare una singola sessione con \"Elimina\", oppure svuotare tutto lo storico delle sessioni con \"Svuota tutto\": entrambe chiedono conferma e non sono reversibili.",
    ],
  },
  {
    title: "Avvisi",
    body: [
      "Quando apri MedStore, se c'è qualcosa che richiede attenzione (un farmaco in scadenza, con scorta bassa o esaurito) compare un banner in alto con il riepilogo, in base a soglie configurabili (default: entro 30 giorni dalla scadenza, quantità bassa sotto il 20%, esaurita sotto il 5%).",
      "Nella scheda di ogni farmaco puoi impostare una \"Scorta minima desiderata\" personalizzata: se la lasci vuota vale la soglia generale del 20%, altrimenti quel farmaco specifico segnala scorta bassa in base alla percentuale che hai scelto tu (utile per farmaci che vuoi tenere sempre ben forniti).",
      "Non essendoci un servizio sempre attivo in background, l'avviso si aggiorna ogni volta che apri l'app: non è una notifica push del telefono, ma un promemoria visibile appena la apri.",
    ],
  },
  {
    title: "Statistiche",
    body: [
      "La pagina Statistiche riassume l'inventario: numero di farmaci in uso e archiviati, da banco vs con ricetta, in scadenza o scaduti, con scorta bassa o esauriti, sessioni di inventario completate e quanti farmaci usa ciascuna persona.",
      "In fondo alla pagina puoi condividere un report testuale dell'inventario attivo (nome, riempimento, scadenza e uso di ogni farmaco): \"Condividi\" apre il pannello di condivisione dello smartphone (WhatsApp, Messaggi, email, ecc.), oppure \"Invia via email\" apre direttamente un nuovo messaggio nel tuo client di posta.",
    ],
  },
  {
    title: "Installazione come app",
    body: [
      "MedStore è una PWA: dal browser dello smartphone puoi \"Aggiungi a schermata Home\" per usarla come un'app, con icona propria e funzionamento offline per le pagine già visitate.",
    ],
  },
  {
    title: "Accesso",
    body: [
      "L'accesso è riservato ai familiari autorizzati tramite Google Sign-In. Se il tuo account non è in whitelist, contatta chi amministra l'app per farti aggiungere.",
    ],
  },
];

export function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-800">Guida a MedStore</h1>
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border border-stone-200 bg-white p-5"
        >
          <h2 className="text-base font-semibold text-stone-800">{section.title}</h2>
          <div className="mt-2 space-y-2 text-sm text-stone-600">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface Section {
  title: string;
  body: string[];
  status?: string;
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
      "Disponi le confezioni su un tavolo e scatta una prima foto d'insieme di tutto il gruppo.",
      "Gira le scatole per mostrare gli altri lati (marca, produttore, data di scadenza) e scatta altre foto dello stesso gruppo.",
      "Il wizard segnala le confezioni non ancora classificabili e ti guida a scattare foto mirate aggiuntive finché non sono tutte riconosciute o confermate manualmente.",
    ],
    status: "Disponibile dalla Milestone 4 (bozza) e Milestone 5 (classificazione IA reale).",
  },
  {
    title: "Classificazione di ogni farmaco",
    body: [
      "Per ogni farmaco vengono registrati: produttore, nome, principio attivo, destinazione d'uso, obbligo o meno di ricetta medica, e i tag con i nomi delle persone che lo usano (inseriti manualmente a fine classificazione).",
      "Puoi correggere in qualsiasi momento questi dati cercando o selezionando il farmaco.",
    ],
    status: "Disponibile dalla Milestone 3.",
  },
  {
    title: "Giacenza e ricerca",
    body: [
      "Ogni farmaco ha una quantità indicativa da 0% a 100%, mostrata con una barra colorata (verde-giallo-rosso in base al livello) e modificabile manualmente in qualsiasi momento.",
      "Usa la ricerca per trovare rapidamente un farmaco e verificarne la giacenza attuale.",
    ],
    status: "Disponibile dalla Milestone 3.",
  },
  {
    title: "Storico delle modifiche",
    body: [
      "Ogni modifica ai dati di un farmaco (quantità, tag, scadenza, ecc.) viene registrata in un log con data e utente che l'ha effettuata, visibile dalla scheda del farmaco.",
    ],
    status: "Disponibile dalla Milestone 3.",
  },
  {
    title: "Storico degli inventari",
    body: [
      "La sezione Inventario elenca tutte le sessioni di rilevazione svolte nel tempo, in corso o concluse.",
      "Aprendo una sessione conclusa vedi un riepilogo: quanti farmaci nuovi sono stati censiti, quanti aggiornati e la quantità registrata per ciascuno in quella rilevazione, per confrontare la situazione tra un controllo e l'altro.",
    ],
    status: "Disponibile dalla Milestone 6.",
  },
  {
    title: "Notifiche",
    body: [
      "MedStore invia notifiche push quando un farmaco sta per scadere, la quantità residua sta per esaurirsi o è esaurita, in base a soglie configurabili (default: entro 30 giorni dalla scadenza, quantità bassa sotto il 20%, esaurita sotto il 5%).",
      "Attivale con il pulsante 🔔 in alto nella pagina: il browser chiederà il permesso di mostrare notifiche.",
    ],
    status: "Disponibile dalla Milestone 7.",
  },
  {
    title: "Statistiche",
    body: [
      "La pagina Statistiche riassume l'inventario: numero di farmaci in uso e archiviati, da banco vs con ricetta, in scadenza o scaduti, con scorta bassa o esauriti, sessioni di inventario completate e quanti farmaci usa ciascuna persona.",
    ],
    status: "Disponibile dalla Milestone 8.",
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
      <h1 className="text-xl font-semibold text-slate-800">Guida a MedStore</h1>
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-lg border border-slate-200 bg-white p-5"
        >
          <h2 className="text-base font-semibold text-slate-800">{section.title}</h2>
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {section.status && (
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-teal-600">
              {section.status}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

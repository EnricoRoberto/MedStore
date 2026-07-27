import { useChangeLog } from "../lib/medications";

const FIELD_LABELS: Record<string, string> = {
  producer: "Produttore",
  name: "Nome",
  activeIngredient: "Principio attivo",
  indication: "Destinazione d'uso",
  requiresPrescription: "Richiede ricetta",
  tags: "Tag",
  quantityPercent: "Quantità",
  expirationDate: "Scadenza",
  status: "Stato",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

export function ChangeLogList({ medicationId }: { medicationId: string }) {
  const entries = useChangeLog(medicationId);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-base font-semibold text-stone-800">Storico modifiche</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">Nessuna modifica registrata.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="border-t border-stone-100 pt-3 text-sm first:border-t-0 first:pt-0"
            >
              <p className="text-stone-500">
                {entry.changedAt?.toDate().toLocaleString("it-IT") ?? "…"} ·{" "}
                {entry.changedBy ?? "sconosciuto"} ·{" "}
                {entry.action === "create" ? "creazione" : "modifica"}
              </p>
              <ul className="mt-1 space-y-0.5 text-stone-700">
                {Object.entries(entry.changes).map(([field, change]) => (
                  <li key={field}>
                    <span className="font-medium">{FIELD_LABELS[field] ?? field}:</span>{" "}
                    {formatValue(change.before)} → {formatValue(change.after)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

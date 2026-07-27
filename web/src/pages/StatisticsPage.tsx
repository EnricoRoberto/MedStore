import { useMemo, useState } from "react";
import { StatCard } from "../components/StatCard";
import { useInventorySessions } from "../lib/inventorySessions";
import { useMedications } from "../lib/medications";
import { isExhausted, isExpired, isExpiringSoon, isLowStock } from "../lib/medicationStatus";
import { useNotificationThresholds } from "../lib/notificationThresholds";
import { buildInventoryReportText } from "../lib/report";

export function StatisticsPage() {
  const medications = useMedications();
  const sessions = useInventorySessions();
  const thresholds = useNotificationThresholds();
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!medications) return null;

    const active = medications.filter((m) => m.status === "active");
    const archived = medications.filter((m) => m.status === "archived");
    const expired = active.filter((m) => isExpired(m));
    const expiringSoon = active.filter((m) => isExpiringSoon(m, thresholds));
    const exhausted = active.filter((m) => isExhausted(m, thresholds));
    const low = active.filter((m) => isLowStock(m, thresholds));
    const requiresPrescription = active.filter((m) => m.requiresPrescription).length;

    const byPerson = new Map<string, number>();
    for (const medication of active) {
      for (const tag of medication.tags) {
        byPerson.set(tag, (byPerson.get(tag) ?? 0) + 1);
      }
    }

    return {
      totalActive: active.length,
      totalArchived: archived.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      exhausted: exhausted.length,
      low: low.length,
      requiresPrescription,
      otc: active.length - requiresPrescription,
      byPerson: Array.from(byPerson.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [medications, thresholds]);

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const lastSession = completedSessions[0];

  if (!stats) {
    return <p className="text-sm text-stone-500">Caricamento…</p>;
  }

  const reportText = buildInventoryReportText(medications ?? []);
  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    "Inventario farmaci MedStore",
  )}&body=${encodeURIComponent(reportText)}`;

  async function handleShareReport() {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: "Inventario farmaci MedStore", text: reportText });
      } catch {
        // annullato dall'utente: nessun errore da mostrare
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(reportText);
      setShareMessage(
        "Report copiato negli appunti: incollalo dove preferisci (WhatsApp, note, email…).",
      );
    } catch {
      setShareMessage("Impossibile copiare automaticamente: seleziona e copia il testo qui sopra.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-stone-800">Statistiche</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Farmaci in uso" value={stats.totalActive} />
        <StatCard label="Farmaci archiviati" value={stats.totalArchived} />
        <StatCard label="Da banco" value={stats.otc} />
        <StatCard label="Con ricetta" value={stats.requiresPrescription} />
        <StatCard label="In scadenza (30gg)" value={stats.expiringSoon} tone="amber" />
        <StatCard label="Scaduti" value={stats.expired} tone="red" />
        <StatCard label="Scorta bassa" value={stats.low} tone="amber" />
        <StatCard label="Esauriti" value={stats.exhausted} tone="red" />
        <StatCard label="Sessioni di inventario" value={completedSessions.length} />
      </div>

      {stats.byPerson.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-base font-semibold text-stone-800">Farmaci per persona</h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {stats.byPerson.map(([person, count]) => (
              <li key={person} className="flex items-center justify-between">
                <span>{person}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lastSession && (
        <p className="text-sm text-stone-500">
          Ultimo inventario completato:{" "}
          {lastSession.completedAt?.toDate().toLocaleDateString("it-IT") ?? "—"}
        </p>
      )}

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
        <div>
          <h2 className="text-base font-semibold text-stone-800">Report inventario</h2>
          <p className="mt-1 text-sm text-stone-500">
            Elenco dei farmaci attivi con riempimento, scadenza e destinazione d'uso, pronto da
            condividere.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleShareReport()}
            className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
          >
            📤 Condividi (WhatsApp, ecc.)
          </button>
          <a
            href={mailtoHref}
            className="inline-flex items-center rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            ✉️ Invia via email
          </a>
        </div>
        {shareMessage && <p className="text-sm text-sage-700">{shareMessage}</p>}
      </section>
    </div>
  );
}

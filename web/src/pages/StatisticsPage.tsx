import { useMemo } from "react";
import { StatCard } from "../components/StatCard";
import { useInventorySessions } from "../lib/inventorySessions";
import { useMedications } from "../lib/medications";

const EXPIRING_WITHIN_DAYS = 30;
const LOW_QUANTITY_PERCENT = 20;
const EXHAUSTED_PERCENT = 5;

function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function StatisticsPage() {
  const medications = useMedications();
  const sessions = useInventorySessions();

  const stats = useMemo(() => {
    if (!medications) return null;

    const active = medications.filter((m) => m.status === "active");
    const archived = medications.filter((m) => m.status === "archived");
    const expired = active.filter((m) => m.expirationDate && daysUntil(m.expirationDate) < 0);
    const expiringSoon = active.filter(
      (m) =>
        m.expirationDate &&
        daysUntil(m.expirationDate) >= 0 &&
        daysUntil(m.expirationDate) <= EXPIRING_WITHIN_DAYS,
    );
    const exhausted = active.filter((m) => m.quantityPercent <= EXHAUSTED_PERCENT);
    const low = active.filter(
      (m) => m.quantityPercent > EXHAUSTED_PERCENT && m.quantityPercent <= LOW_QUANTITY_PERCENT,
    );
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
  }, [medications]);

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const lastSession = completedSessions[0];

  if (!stats) {
    return <p className="text-sm text-slate-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Statistiche</h1>

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
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-800">Farmaci per persona</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
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
        <p className="text-sm text-slate-500">
          Ultimo inventario completato:{" "}
          {lastSession.completedAt?.toDate().toLocaleDateString("it-IT") ?? "—"}
        </p>
      )}
    </div>
  );
}

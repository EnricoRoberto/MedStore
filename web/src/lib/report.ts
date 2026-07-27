import type { Medication } from "../types/medication";

export function buildInventoryReportText(medications: Medication[]): string {
  const active = [...medications]
    .filter((m) => m.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  const date = new Date().toLocaleDateString("it-IT");
  const lines = [`Report inventario farmaci — ${date}`, ""];

  if (active.length === 0) {
    lines.push("Nessun farmaco attivo in inventario.");
  } else {
    for (const m of active) {
      const scadenza = m.expirationDate ?? "n.d.";
      const usoLabel = m.indication || "n.d.";
      lines.push(
        `• ${m.name}${m.producer ? ` (${m.producer})` : ""} — riempimento ${m.quantityPercent}% · scadenza ${scadenza} · uso: ${usoLabel}`,
      );
    }
  }

  lines.push("", `Totale farmaci attivi: ${active.length}`);
  return lines.join("\n");
}

import type { Medication } from "../types/medication";

// Formattazione pensata per canali di solo testo (WhatsApp, email): un blocco
// per farmaco separato da una riga vuota, nome in grassetto (WhatsApp
// interpreta *testo* come grassetto; nei client email compare comunque come
// un evidente delimitatore visivo) invece di un unico elenco puntato compatto.
export function buildInventoryReportText(medications: Medication[]): string {
  const active = [...medications]
    .filter((m) => m.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  const date = new Date().toLocaleDateString("it-IT");
  const lines = [`*Report inventario farmaci* — ${date}`, ""];

  if (active.length === 0) {
    lines.push("Nessun farmaco attivo in inventario.");
  } else {
    active.forEach((m, index) => {
      const scadenza = m.expirationDate ?? "n.d.";
      const usoLabel = m.indication || "n.d.";
      lines.push(
        `${index + 1}. *${m.name}*${m.producer ? ` (${m.producer})` : ""}`,
        `   💊 Riempimento: ${m.quantityPercent}%`,
        `   📅 Scadenza: ${scadenza}`,
        `   🏷️ Uso: ${usoLabel}`,
        "",
      );
    });
  }

  lines.push(`Totale farmaci attivi: ${active.length}`);
  return lines.join("\n");
}

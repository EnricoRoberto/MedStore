import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  createInventorySession,
  deleteAllInventorySessions,
  deleteInventorySession,
  useInventorySessions,
} from "../lib/inventorySessions";

export function InventorySessionsListPage() {
  const sessions = useInventorySessions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const id = await createInventorySession(user?.email ?? "sconosciuto");
      navigate(`/inventario/${id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(sessionId: string, label: string) {
    if (!window.confirm(`Eliminare la sessione "${label}"? L'azione non è reversibile.`)) {
      return;
    }
    setDeletingId(sessionId);
    setError(null);
    try {
      await deleteInventorySession(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eliminazione non riuscita.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    if (!sessions || sessions.length === 0) return;
    if (
      !window.confirm(
        `Svuotare tutto l'inventario? Verranno eliminate definitivamente tutte le ${sessions.length} sessioni di inventario. L'azione non è reversibile.`,
      )
    ) {
      return;
    }
    setClearing(true);
    setError(null);
    try {
      await deleteAllInventorySessions(sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Svuotamento non riuscito.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-stone-800">Inventario</h1>
        <div className="flex shrink-0 gap-2">
          <button
            disabled={creating}
            onClick={() => void handleCreate()}
            className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
          >
            + Nuova sessione
          </button>
          {sessions && sessions.length > 0 && (
            <button
              type="button"
              disabled={clearing}
              onClick={() => void handleClearAll()}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {clearing ? "Svuotamento…" : "Svuota tutto"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {sessions === null && <p className="text-sm text-stone-500">Caricamento…</p>}

      {sessions !== null && sessions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Nessuna sessione di inventario ancora. Avviane una per iniziare a censire i farmaci.
        </p>
      )}

      <ul className="space-y-2">
        {sessions?.map((session) => {
          const label = session.startedAt?.toDate().toLocaleString("it-IT") ?? "In corso";
          return (
            <li
              key={session.id}
              className="flex items-center gap-2 rounded-2xl border-2 border-stone-400 bg-white p-4 shadow-md hover:border-terracotta-400 hover:shadow-lg"
            >
              <Link to={`/inventario/${session.id}`} className="flex flex-1 items-center justify-between gap-3">
                <span className="text-sm text-stone-700">{label}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    session.status === "completed"
                      ? "bg-sage-100 text-sage-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {session.status === "completed" ? "Completata" : "In corso"}
                </span>
              </Link>
              <button
                type="button"
                disabled={deletingId === session.id}
                onClick={() => void handleDelete(session.id, label)}
                className="shrink-0 rounded-xl px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === session.id ? "…" : "Elimina"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

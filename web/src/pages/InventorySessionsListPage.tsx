import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { createInventorySession, useInventorySessions } from "../lib/inventorySessions";

export function InventorySessionsListPage() {
  const sessions = useInventorySessions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const id = await createInventorySession(user?.email ?? "sconosciuto");
      navigate(`/inventario/${id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-800">Inventario</h1>
        <button
          disabled={creating}
          onClick={() => void handleCreate()}
          className="rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
        >
          + Nuova sessione
        </button>
      </div>

      {sessions === null && <p className="text-sm text-stone-500">Caricamento…</p>}

      {sessions !== null && sessions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          Nessuna sessione di inventario ancora. Avviane una per iniziare a censire i farmaci.
        </p>
      )}

      <ul className="space-y-2">
        {sessions?.map((session) => (
          <li key={session.id}>
            <Link
              to={`/inventario/${session.id}`}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 hover:border-terracotta-300 hover:shadow-sm"
            >
              <span className="text-sm text-stone-700">
                {session.startedAt?.toDate().toLocaleString("it-IT") ?? "In corso"}
              </span>
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
          </li>
        ))}
      </ul>
    </div>
  );
}

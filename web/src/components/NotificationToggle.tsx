import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { enablePushNotifications } from "../lib/notifications";

function currentPermission(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

export function NotificationToggle() {
  const { user } = useAuth();
  const [status, setStatus] = useState(currentPermission());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Il permesso può essere già stato concesso in una sessione precedente:
    // rinnova silenziosamente il token salvato senza richiedere un nuovo click.
    if (user && currentPermission() === "granted") {
      void enablePushNotifications(user.uid);
    }
  }, [user]);

  async function handleEnable() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const result = await enablePushNotifications(user.uid);
      if (result === "unsupported") {
        setError("Le notifiche push non sono supportate su questo browser.");
      } else if (result === "denied") {
        setError("Permesso negato. Abilita le notifiche dalle impostazioni del browser.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attivazione notifiche non riuscita.");
    } finally {
      setStatus(currentPermission());
      setBusy(false);
    }
  }

  if (status === "granted") {
    return <span className="text-xs font-medium text-emerald-600">🔔 Notifiche attive</span>;
  }

  return (
    <button
      disabled={busy || status === "unsupported"}
      onClick={() => void handleEnable()}
      title={error ?? undefined}
      className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
    >
      🔔 Attiva notifiche
    </button>
  );
}

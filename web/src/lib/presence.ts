import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

const PRESENCE_COLLECTION = "presence";
const HEARTBEAT_INTERVAL_MS = 45_000;
// Nessun modo nativo in Firestore (a differenza di Realtime Database) di
// rilevare all'istante quando un client si disconnette senza un servizio
// aggiuntivo: si considera "online" chi ha scritto un battito negli ultimi
// due minuti. Solo informativo, non serve maggiore precisione.
const ONLINE_WINDOW_MS = 120_000;

export function useHeartbeat(uid: string | undefined, email: string | null | undefined): void {
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, PRESENCE_COLLECTION, uid);
    const beat = () => void setDoc(ref, { email: email ?? null, lastSeen: serverTimestamp() });
    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [uid, email]);
}

export function useOnlineUsersCount(): number {
  const [lastSeenByUid, setLastSeenByUid] = useState<Map<string, Timestamp>>(new Map());
  const [, forceTick] = useState(0);

  useEffect(() => {
    return onSnapshot(collection(db, PRESENCE_COLLECTION), (snapshot) => {
      const next = new Map<string, Timestamp>();
      for (const d of snapshot.docs) {
        const lastSeen = d.data().lastSeen as Timestamp | undefined;
        if (lastSeen) next.set(d.id, lastSeen);
      }
      setLastSeenByUid(next);
    });
  }, []);

  // Il conteggio va ricalcolato periodicamente anche senza nuovi eventi,
  // perché "adesso" avanza mentre gli utenti restano fermi sulla stessa foto.
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  let count = 0;
  for (const lastSeen of lastSeenByUid.values()) {
    if (now - lastSeen.toMillis() <= ONLINE_WINDOW_MS) count += 1;
  }
  return count;
}

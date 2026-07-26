import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import type { ChangeLogEntry, Medication, MedicationFormValues } from "../types/medication";

const MEDICATIONS_COLLECTION = "medications";

const TRACKED_FIELDS = [
  "producer",
  "name",
  "activeIngredient",
  "indication",
  "requiresPrescription",
  "tags",
  "quantityPercent",
  "expirationDate",
  "status",
] as const;

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// Nessuna Cloud Function di audit: il diff viene calcolato qui e scritto nello
// stesso batch della modifica al farmaco (vedi createMedication/updateMedication).
function computeChanges(
  before: Partial<MedicationFormValues> | null,
  after: MedicationFormValues,
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const field of TRACKED_FIELDS) {
    const beforeValue = before?.[field];
    const afterValue = after[field];
    if (!valuesEqual(beforeValue, afterValue)) {
      changes[field] = { before: beforeValue ?? null, after: afterValue ?? null };
    }
  }
  return changes;
}

function fromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): Medication {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    producer: data.producer ?? "",
    name: data.name ?? "",
    activeIngredient: data.activeIngredient ?? "",
    indication: data.indication ?? "",
    requiresPrescription: data.requiresPrescription ?? false,
    tags: data.tags ?? [],
    quantityPercent: data.quantityPercent ?? 0,
    expirationDate: data.expirationDate ?? null,
    status: data.status ?? "active",
    lastModifiedBy: data.lastModifiedBy ?? null,
    lastModifiedAt: data.lastModifiedAt ?? null,
    createdAt: data.createdAt ?? null,
  };
}

export function useMedications(): Medication[] | null {
  const [medications, setMedications] = useState<Medication[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, MEDICATIONS_COLLECTION), orderBy("name"));
    return onSnapshot(q, (snapshot) => {
      setMedications(snapshot.docs.map(fromDoc));
    });
  }, []);

  return medications;
}

// undefined = loading, null = not found.
export function useMedication(id: string | undefined): Medication | null | undefined {
  const [medication, setMedication] = useState<Medication | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setMedication(null);
      return;
    }
    setMedication(undefined);
    return onSnapshot(doc(db, MEDICATIONS_COLLECTION, id), (snapshot) => {
      setMedication(
        snapshot.exists()
          ? fromDoc(snapshot as QueryDocumentSnapshot<DocumentData>)
          : null,
      );
    });
  }, [id]);

  return medication;
}

export function useChangeLog(medicationId: string | undefined): ChangeLogEntry[] {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);

  useEffect(() => {
    if (!medicationId) {
      setEntries([]);
      return;
    }
    const q = query(
      collection(db, MEDICATIONS_COLLECTION, medicationId, "changeLog"),
      orderBy("changedAt", "desc"),
    );
    return onSnapshot(q, (snapshot) => {
      setEntries(
        snapshot.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<ChangeLogEntry, "id">) }) as ChangeLogEntry,
        ),
      );
    });
  }, [medicationId]);

  return entries;
}

export async function createMedication(
  values: MedicationFormValues,
  editorLabel: string,
  photoRefs: string[] = [],
): Promise<string> {
  const medicationRef = doc(collection(db, MEDICATIONS_COLLECTION));
  const changeLogRef = doc(collection(medicationRef, "changeLog"));

  const batch = writeBatch(db);
  batch.set(medicationRef, {
    ...values,
    photoRefs,
    lastModifiedBy: editorLabel,
    lastModifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  batch.set(changeLogRef, {
    action: "create",
    changes: computeChanges(null, values),
    changedBy: editorLabel,
    changedAt: serverTimestamp(),
  });
  await batch.commit();

  return medicationRef.id;
}

export async function updateMedication(
  id: string,
  values: MedicationFormValues,
  editorLabel: string,
  photoRefs?: string[],
): Promise<void> {
  const medicationRef = doc(db, MEDICATIONS_COLLECTION, id);
  const previousSnap = await getDoc(medicationRef);
  const previous = previousSnap.exists()
    ? (previousSnap.data() as Partial<MedicationFormValues>)
    : null;
  const changes = computeChanges(previous, values);

  const batch = writeBatch(db);
  batch.update(medicationRef, {
    ...values,
    ...(photoRefs && photoRefs.length > 0 ? { photoRefs: arrayUnion(...photoRefs) } : {}),
    lastModifiedBy: editorLabel,
    lastModifiedAt: serverTimestamp(),
  });

  if (Object.keys(changes).length > 0) {
    const changeLogRef = doc(collection(medicationRef, "changeLog"));
    batch.set(changeLogRef, {
      action: "update",
      changes,
      changedBy: editorLabel,
      changedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

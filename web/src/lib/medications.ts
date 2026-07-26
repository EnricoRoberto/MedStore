import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import type { ChangeLogEntry, Medication, MedicationFormValues } from "../types/medication";

const MEDICATIONS_COLLECTION = "medications";

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
): Promise<void> {
  await addDoc(collection(db, MEDICATIONS_COLLECTION), {
    ...values,
    photoRefs: [],
    lastModifiedBy: editorLabel,
    lastModifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function updateMedication(
  id: string,
  values: MedicationFormValues,
  editorLabel: string,
): Promise<void> {
  await updateDoc(doc(db, MEDICATIONS_COLLECTION, id), {
    ...values,
    lastModifiedBy: editorLabel,
    lastModifiedAt: serverTimestamp(),
  });
}

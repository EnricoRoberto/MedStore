import {
  addDoc,
  arrayUnion,
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
import { compressImageToDataUrl } from "./imageCompress";
import { createMedication, updateMedication } from "./medications";
import type {
  BoxStatus,
  DetectedBox,
  InventorySession,
  PhotoType,
  SessionPhoto,
} from "../types/inventorySession";
import type { MedicationFormValues } from "../types/medication";

const SESSIONS_COLLECTION = "inventorySessions";

function sessionFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): InventorySession {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    status: data.status ?? "in_progress",
    startedAt: data.startedAt ?? null,
    completedAt: data.completedAt ?? null,
    createdBy: data.createdBy ?? null,
  };
}

export function useInventorySessions(): InventorySession[] | null {
  const [sessions, setSessions] = useState<InventorySession[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, SESSIONS_COLLECTION), orderBy("startedAt", "desc"));
    return onSnapshot(q, (snapshot) => setSessions(snapshot.docs.map(sessionFromDoc)));
  }, []);

  return sessions;
}

// undefined = loading, null = not found.
export function useInventorySession(id: string | undefined): InventorySession | null | undefined {
  const [session, setSession] = useState<InventorySession | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setSession(null);
      return;
    }
    setSession(undefined);
    return onSnapshot(doc(db, SESSIONS_COLLECTION, id), (snapshot) =>
      setSession(
        snapshot.exists() ? sessionFromDoc(snapshot as QueryDocumentSnapshot<DocumentData>) : null,
      ),
    );
  }, [id]);

  return session;
}

export async function createInventorySession(editorLabel: string): Promise<string> {
  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
    status: "in_progress" satisfies InventorySession["status"],
    startedAt: serverTimestamp(),
    completedAt: null,
    createdBy: editorLabel,
  });
  return docRef.id;
}

export async function completeInventorySession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), {
    status: "completed" satisfies InventorySession["status"],
    completedAt: serverTimestamp(),
  });
}

function photoFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): SessionPhoto {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    type: data.type ?? "general",
    dataUrl: data.dataUrl ?? "",
    contentType: data.contentType ?? "image/jpeg",
    boxId: data.boxId ?? null,
    uploadedAt: data.uploadedAt ?? null,
    uploadedBy: data.uploadedBy ?? null,
  };
}

export function usePhotos(sessionId: string | undefined): SessionPhoto[] {
  const [photos, setPhotos] = useState<SessionPhoto[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setPhotos([]);
      return;
    }
    const q = query(
      collection(db, SESSIONS_COLLECTION, sessionId, "photos"),
      orderBy("uploadedAt", "asc"),
    );
    return onSnapshot(q, (snapshot) => setPhotos(snapshot.docs.map(photoFromDoc)));
  }, [sessionId]);

  return photos;
}

export async function uploadSessionPhoto(
  sessionId: string,
  file: File,
  type: PhotoType,
  uploadedBy: string,
  boxId: string | null = null,
): Promise<string> {
  const dataUrl = await compressImageToDataUrl(file);

  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION, sessionId, "photos"), {
    type,
    dataUrl,
    contentType: "image/jpeg",
    boxId,
    uploadedAt: serverTimestamp(),
    uploadedBy,
  });
  return docRef.id;
}

function boxFromDoc(snapshot: QueryDocumentSnapshot<DocumentData>): DetectedBox {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    label: data.label ?? "Scatola",
    status: data.status ?? "unclassified",
    photoIds: data.photoIds ?? [],
    classification: data.classification ?? null,
    medicationId: data.medicationId ?? null,
    confidence: data.confidence ?? null,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function useDetectedBoxes(sessionId: string | undefined): DetectedBox[] {
  const [boxes, setBoxes] = useState<DetectedBox[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setBoxes([]);
      return;
    }
    const q = query(
      collection(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(q, (snapshot) => setBoxes(snapshot.docs.map(boxFromDoc)));
  }, [sessionId]);

  return boxes;
}

export async function addDetectedBox(sessionId: string, label: string): Promise<string> {
  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes"), {
    label,
    status: "unclassified" satisfies BoxStatus,
    photoIds: [],
    classification: null,
    medicationId: null,
    confidence: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function linkPhotoToBox(
  sessionId: string,
  boxId: string,
  photoId: string,
): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes", boxId), {
    photoIds: arrayUnion(photoId),
    updatedAt: serverTimestamp(),
  });
}

export async function setBoxStatus(
  sessionId: string,
  boxId: string,
  status: BoxStatus,
): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes", boxId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function classifyBox(
  sessionId: string,
  boxId: string,
  classification: MedicationFormValues,
): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes", boxId), {
    classification,
    status: "classified" satisfies BoxStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function confirmBoxAsNewMedication(
  sessionId: string,
  box: DetectedBox,
  editorLabel: string,
  photoRefs: string[],
): Promise<void> {
  if (!box.classification) {
    throw new Error("La scatola non è ancora stata classificata.");
  }
  const medicationId = await createMedication(box.classification, editorLabel, photoRefs);
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes", box.id), {
    medicationId,
    status: "confirmed" satisfies BoxStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function confirmBoxAsExistingMedication(
  sessionId: string,
  box: DetectedBox,
  medicationId: string,
  editorLabel: string,
  photoRefs: string[],
): Promise<void> {
  if (!box.classification) {
    throw new Error("La scatola non è ancora stata classificata.");
  }
  await updateMedication(medicationId, box.classification, editorLabel, photoRefs);
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId, "detectedBoxes", box.id), {
    medicationId,
    status: "merged_into_existing" satisfies BoxStatus,
    updatedAt: serverTimestamp(),
  });
}

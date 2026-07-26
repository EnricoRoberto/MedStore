import type { Timestamp } from "firebase/firestore";
import type { MedicationFormValues } from "./medication";

export type InventorySessionStatus = "in_progress" | "completed";

export interface InventorySession {
  id: string;
  status: InventorySessionStatus;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  createdBy: string | null;
}

export type PhotoType = "general" | "rotation" | "targeted";

export interface SessionPhoto {
  id: string;
  type: PhotoType;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  boxId: string | null;
  uploadedAt: Timestamp | null;
  uploadedBy: string | null;
}

export type BoxStatus =
  | "unclassified"
  | "needs_more_photos"
  | "classified"
  | "confirmed"
  | "merged_into_existing";

export interface DetectedBox {
  id: string;
  label: string;
  status: BoxStatus;
  photoIds: string[];
  classification: MedicationFormValues | null;
  medicationId: string | null;
  confidence: number | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

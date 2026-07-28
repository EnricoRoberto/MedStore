import type { Timestamp } from "firebase/firestore";

export type MedicationStatus = "active" | "archived";

export interface Medication {
  id: string;
  producer: string;
  name: string;
  activeIngredient: string;
  indication: string;
  requiresPrescription: boolean;
  requiresRefrigeration: boolean;
  tags: string[];
  quantityPercent: number;
  minQuantityPercent: number | null;
  expirationDate: string | null;
  status: MedicationStatus;
  lastModifiedBy: string | null;
  lastModifiedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface MedicationFormValues {
  producer: string;
  name: string;
  activeIngredient: string;
  indication: string;
  requiresPrescription: boolean;
  requiresRefrigeration: boolean;
  tags: string[];
  quantityPercent: number;
  minQuantityPercent: number | null;
  expirationDate: string | null;
  status: MedicationStatus;
}

export interface MedicationPhoto {
  id: string;
  dataUrl: string;
  uploadedAt: Timestamp | null;
  uploadedBy: string | null;
}

export interface ChangeLogEntry {
  id: string;
  action: "create" | "update";
  changes: Record<string, { before: unknown; after: unknown }>;
  changedBy: string | null;
  changedAt: Timestamp | null;
}

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

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

export const onMedicationWrite = onDocumentWritten(
  { document: "medications/{medicationId}", region: "europe-west1" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after) {
      // Document deleted; rules deny delete so this should not normally happen.
      return;
    }

    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const field of TRACKED_FIELDS) {
      const beforeValue = before?.[field];
      const afterValue = after[field];
      if (!valuesEqual(beforeValue, afterValue)) {
        changes[field] = { before: beforeValue ?? null, after: afterValue ?? null };
      }
    }

    if (Object.keys(changes).length === 0) {
      return;
    }

    const db = getFirestore();
    await db
      .collection("medications")
      .doc(event.params.medicationId)
      .collection("changeLog")
      .add({
        action: before ? "update" : "create",
        changes,
        changedBy: after.lastModifiedBy ?? null,
        changedAt: FieldValue.serverTimestamp(),
      });
  },
);

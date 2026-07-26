import { initializeApp } from "firebase-admin/app";

initializeApp();

export { enforceAllowlist } from "./auth/enforceAllowlist.js";
export { onMedicationWrite } from "./triggers/onMedicationWrite.js";

// Function exports are added milestone by milestone:
// - classify/classifyPhotos, classify/linkBoxToMedication (M5)
// - notifications/scheduledNotificationScan (M7)

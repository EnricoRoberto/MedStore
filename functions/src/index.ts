import { initializeApp } from "firebase-admin/app";

initializeApp();

export { enforceAllowlist } from "./auth/enforceAllowlist.js";

// Function exports are added milestone by milestone:
// - classify/classifyPhotos, classify/linkBoxToMedication (M5)
// - triggers/onMedicationWrite (M3)
// - notifications/scheduledNotificationScan (M7)

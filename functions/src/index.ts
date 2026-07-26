import { initializeApp } from "firebase-admin/app";

initializeApp();

export { enforceAllowlist } from "./auth/enforceAllowlist.js";
export { onMedicationWrite } from "./triggers/onMedicationWrite.js";
export { classifyPhotos } from "./classify/classifyPhotos.js";
export { scheduledNotificationScan } from "./notifications/scheduledNotificationScan.js";

import { beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Identity Platform blocking functions (beforeUserSignedIn/beforeUserCreated)
// only deploy to us-central1, unlike the rest of this codebase's callable
// and trigger functions (europe-west1).
export const enforceAllowlist = beforeUserSignedIn(
  { region: "us-central1" },
  async (event) => {
    const data = event.data;
    if (!data) {
      throw new HttpsError("invalid-argument", "Dati utente mancanti.");
    }

    const email = data.email?.toLowerCase();
    if (!email) {
      throw new HttpsError(
        "invalid-argument",
        "Nessuna email associata a questo account Google.",
      );
    }

    const db = getFirestore();
    const allowlistDoc = await db.collection("allowlist").doc(email).get();

    if (!allowlistDoc.exists || allowlistDoc.data()?.active === false) {
      throw new HttpsError(
        "permission-denied",
        "Questo account non è autorizzato a usare MedStore. Contatta l'amministratore.",
      );
    }

    const userRef = db.collection("users").doc(data.uid);
    const userSnap = await userRef.get();
    await userRef.set(
      {
        email,
        displayName: data.displayName ?? null,
        photoURL: data.photoURL ?? null,
        lastSignInAt: FieldValue.serverTimestamp(),
        ...(userSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );

    return {
      customClaims: { allowlisted: true },
    };
  },
);

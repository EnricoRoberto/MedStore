import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type AuthStatus = "loading" | "signed-out" | "unauthorized" | "authorized";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signInError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Nessuna Cloud Function/custom claim: la whitelist si verifica leggendo
// direttamente /allowlist/{email} (le regole permettono a ciascun utente di
// leggere solo la propria voce). Se autorizzato, sincronizza /users/{uid}.
async function checkAllowlistedAndSyncUser(user: User): Promise<boolean> {
  if (!user.email) return false;

  const allowlistSnap = await getDoc(doc(db, "allowlist", user.email));
  const isAllowlisted = allowlistSnap.exists() && allowlistSnap.data().active === true;
  if (!isAllowlisted) {
    return false;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  await setDoc(
    userRef,
    {
      email: user.email,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      lastSignInAt: serverTimestamp(),
      ...(userSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(nextUser);
        setStatus("signed-out");
        return;
      }
      setUser(nextUser);
      const allowlisted = await checkAllowlistedAndSyncUser(nextUser);
      setStatus(allowlisted ? "authorized" : "unauthorized");
    });
  }, []);

  async function signInWithGoogle() {
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : "Accesso non riuscito. Riprova.");
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ status, user, signInError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

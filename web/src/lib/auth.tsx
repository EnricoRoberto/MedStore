import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    return onIdTokenChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(nextUser);
        setStatus("signed-out");
        return;
      }
      const tokenResult = await nextUser.getIdTokenResult();
      setUser(nextUser);
      setStatus(tokenResult.claims.allowlisted === true ? "authorized" : "unauthorized");
    });
  }, []);

  async function signInWithGoogle() {
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setSignInError(
        error instanceof Error ? error.message : "Accesso non riuscito. Riprova.",
      );
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

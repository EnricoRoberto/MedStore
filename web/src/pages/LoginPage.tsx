import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { signInError, signInWithGoogle } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <img src="/favicon.svg" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-2xl font-semibold text-stone-800">MedStore</h1>
        <p className="mt-2 text-sm text-stone-500">
          Accedi con l'account Google autorizzato per gestire l'inventario dei
          farmaci di casa.
        </p>
        <button
          onClick={() => void signInWithGoogle()}
          className="mt-6 w-full rounded-xl bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          Accedi con Google
        </button>
        {signInError && <p className="mt-4 text-sm text-red-600">{signInError}</p>}
      </div>
    </main>
  );
}

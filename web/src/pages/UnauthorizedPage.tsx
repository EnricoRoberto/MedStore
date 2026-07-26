import { useAuth } from "../lib/auth";

export function UnauthorizedPage() {
  const { user, signOut } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">Accesso non autorizzato</h1>
        <p className="mt-2 text-sm text-slate-500">
          L'account {user?.email} non è nella whitelist di MedStore. Chiedi
          all'amministratore di aggiungerlo, poi accedi di nuovo.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-6 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cambia account
        </button>
      </div>
    </main>
  );
}

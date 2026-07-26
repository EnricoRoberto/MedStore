import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? "bg-teal-100 text-teal-800" : "text-slate-600 hover:bg-slate-100"
  }`;
}

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-semibold text-teal-700">MedStore</span>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Farmaci
            </NavLink>
            <NavLink to="/inventario" className={navLinkClass}>
              Inventario
            </NavLink>
            <NavLink to="/guida" className={navLinkClass}>
              Guida
            </NavLink>
          </nav>
          <div className="flex items-center gap-3">
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
            )}
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              onClick={() => void signOut()}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Esci
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

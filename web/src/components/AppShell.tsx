import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AlertsBanner } from "./AlertsBanner";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `shrink-0 rounded-xl px-3 py-2 text-sm font-medium ${
    isActive ? "bg-terracotta-100 text-terracotta-800" : "text-stone-600 hover:bg-stone-100"
  }`;
}

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream-50">
      <header className="overflow-x-hidden border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <span className="flex shrink-0 items-center gap-2 text-lg font-semibold text-terracotta-700">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            MedStore
          </span>
          <nav className="flex flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavLink to="/" end className={navLinkClass}>
              Farmaci
            </NavLink>
            <NavLink to="/inventario" className={navLinkClass}>
              Inventario
            </NavLink>
            <NavLink to="/statistiche" className={navLinkClass}>
              Statistiche
            </NavLink>
            <NavLink to="/guida" className={navLinkClass}>
              Guida
            </NavLink>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
            )}
            <span className="hidden text-sm text-stone-600 sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              onClick={() => void signOut()}
              className="text-sm font-medium text-stone-500 hover:text-stone-700"
            >
              Esci
            </button>
          </div>
        </div>
      </header>
      <AlertsBanner />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

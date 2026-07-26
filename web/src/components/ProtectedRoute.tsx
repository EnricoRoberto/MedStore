import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Caricamento…
      </div>
    );
  }

  if (status === "signed-out") {
    return <Navigate to="/login" replace />;
  }

  if (status === "unauthorized") {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}

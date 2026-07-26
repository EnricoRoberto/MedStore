import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./lib/auth";
import { HelpPage } from "./pages/HelpPage";
import { MedicationFormPage } from "./pages/MedicationFormPage";
import { MedicationsListPage } from "./pages/MedicationsListPage";
import { LoginPage } from "./pages/LoginPage";

function LoginRoute() {
  const { status } = useAuth();

  if (status === "authorized" || status === "unauthorized") {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<MedicationsListPage />} />
        <Route path="farmaci/nuovo" element={<MedicationFormPage />} />
        <Route path="farmaci/:id" element={<MedicationFormPage />} />
        <Route path="guida" element={<HelpPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

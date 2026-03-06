import { Navigate } from "react-router";
import { useAuth } from "./auth-context";
import { AppLayout } from "./app-layout";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

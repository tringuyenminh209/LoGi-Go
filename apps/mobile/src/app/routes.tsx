import { createBrowserRouter, Navigate, useNavigate, useParams, Outlet } from "react-router";
import { useAuth } from "./context/AuthContext";
import { MobileShell } from "./components/mobile/MobileShell";
import { LoginScreen } from "./components/mobile/LoginScreen";
import { HomeScreen } from "./components/mobile/HomeScreen";
import { MatchScreen } from "./components/mobile/MatchScreen";
import { DeliveryScreen } from "./components/mobile/DeliveryScreen";
import { DeliveryDetailScreen } from "./components/mobile/DeliveryDetailScreen";
import { MapScreen } from "./components/mobile/MapScreen";
import { ProfileScreen } from "./components/mobile/ProfileScreen";
import { NotificationListScreen } from "./components/mobile/NotificationListScreen";
import { SafetyInfoScreen } from "./components/mobile/SafetyInfoScreen";
import { OcrReviewScreen } from "./components/mobile/OcrReviewScreen";
import { CarbonDashboardScreen } from "./components/mobile/CarbonDashboardScreen";
import { CertificationsScreen } from "./components/mobile/CertificationsScreen";

// ─── Protected route ─────────────────────────────────────────────────────────

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// ─── Route adapters: bridge useNavigate → screen prop callbacks ───────────────

function LoginRoute() {
  const nav = useNavigate();
  return <LoginScreen onLogin={() => nav("/")} />;
}

function HomeRoute() {
  const nav = useNavigate();
  return (
    <HomeScreen
      onNavigate={(screen) => {
        if (screen.startsWith("delivery-detail:")) {
          nav(`/jobs/${screen.split(":")[1]}`);
        } else {
          nav(`/${screen === "home" ? "" : screen}`);
        }
      }}
      onShowMatch={() => nav("/match")}
      onShowNotifications={() => nav("/notifications")}
      onShowSafety={() => nav("/safety")}
      onShowDeliveryDetail={(id) => nav(`/jobs/${id}`)}
    />
  );
}

function MatchRoute() {
  const nav = useNavigate();
  return <MatchScreen onBack={() => nav(-1)} />;
}

function DeliveryRoute() {
  const nav = useNavigate();
  return <DeliveryScreen onBack={() => nav(-1)} onShowDetail={(id) => nav(`/jobs/${id}`)} />;
}

function DeliveryDetailRoute() {
  const nav = useNavigate();
  const { deliveryId } = useParams<{ deliveryId: string }>();
  return <DeliveryDetailScreen deliveryId={deliveryId ?? "LG-2847"} onBack={() => nav(-1)} />;
}

function MapRoute() {
  const nav = useNavigate();
  return <MapScreen onBack={() => nav(-1)} />;
}

function ProfileRoute() {
  const nav = useNavigate();
  return (
    <ProfileScreen
      onBack={() => nav(-1)}
      onLogout={() => nav("/login", { replace: true })}
      onNavigate={(screen) => nav(`/${screen}`)}
    />
  );
}

function NotificationsRoute() {
  const nav = useNavigate();
  return (
    <NotificationListScreen
      onBack={() => nav(-1)}
      onNavigate={(screen) => {
        if (screen.startsWith("delivery-detail:")) {
          nav(`/jobs/${screen.split(":")[1]}`);
        } else {
          nav(`/${screen}`);
        }
      }}
    />
  );
}

function SafetyRoute() {
  const nav = useNavigate();
  return <SafetyInfoScreen onBack={() => nav(-1)} />;
}

function OcrReviewRoute() {
  const nav = useNavigate();
  return <OcrReviewScreen onBack={() => nav(-1)} />;
}

function CarbonRoute() {
  const nav = useNavigate();
  return <CarbonDashboardScreen onBack={() => nav(-1)} />;
}

function CertificationsRoute() {
  const nav = useNavigate();
  return <CertificationsScreen onBack={() => nav(-1)} />;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  { path: "/login", Component: LoginRoute },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [{
    path: "",
    Component: MobileShell,
    children: [
      { index: true, Component: HomeRoute },
      { path: "match", Component: MatchRoute },
      { path: "jobs", Component: DeliveryRoute },
      { path: "jobs/:deliveryId", Component: DeliveryDetailRoute },
      { path: "map", Component: MapRoute },
      { path: "profile", Component: ProfileRoute },
      { path: "notifications", Component: NotificationsRoute },
      { path: "safety", Component: SafetyRoute },
      { path: "ocr-review", Component: OcrReviewRoute },
      { path: "carbon", Component: CarbonRoute },
      { path: "certifications", Component: CertificationsRoute },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  }]},
]);

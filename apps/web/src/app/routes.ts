import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/protected-route";
import { LoginPage } from "./components/login-page";
import { DashboardPage } from "./components/dashboard-page";
import { MatchEnginePage } from "./components/match-engine-page";
import { LegacyBridgePage } from "./components/legacy-bridge-page";
import { RealtimeMapPage } from "./components/realtime-map-page";
import { ShipmentsPage } from "./components/shipments-page";
import { DisasterPage } from "./components/disaster-page";
import { AnalyticsPage } from "./components/analytics-page";
import { CarbonPage } from "./components/carbon-page";
import { IntegrationsPage } from "./components/integrations-page";
import { SecurityPage } from "./components/security-page";
import { InfraPage } from "./components/infra-page";
import { SettingsPage } from "./components/settings-page";
import { NotificationsPage } from "./components/notifications-page";

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      { index: true, Component: DashboardPage },
      { path: "matching", Component: MatchEnginePage },
      { path: "legacy-bridge", Component: LegacyBridgePage },
      { path: "map", Component: RealtimeMapPage },
      { path: "shipments", Component: ShipmentsPage },
      { path: "disaster", Component: DisasterPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "carbon", Component: CarbonPage },
      { path: "integrations", Component: IntegrationsPage },
      { path: "security", Component: SecurityPage },
      { path: "infra", Component: InfraPage },
      { path: "settings", Component: SettingsPage },
      { path: "notifications", Component: NotificationsPage },
    ],
  },
]);
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { EarthquakeAlert } from "./EarthquakeAlert";
import { AnimatePresence, motion } from "motion/react";
import { useWs } from "../../context/WsContext";
import { useAuth } from "../../context/AuthContext";

const HIDE_BOTTOM_NAV = ["/login", "/map"];

const NAV_ACTIVE_MAP: Record<string, string> = {
  "/match": "home",
  "/notifications": "home",
  "/safety": "home",
  "/jobs": "jobs",
  "/profile": "profile",
  "/ocr-review": "profile",
  "/carbon": "profile",
  "/certifications": "profile",
};

function getActiveNav(pathname: string): string {
  if (pathname.startsWith("/jobs/")) return "jobs";
  return (NAV_ACTIVE_MAP[pathname] ?? pathname.replace("/", "")) || "home";
}

export function MobileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { earthquakeAlert, dismissAlert, sendLocation, isConnected } = useWs();
  const { driver } = useAuth();

  const hideBottomNav = HIDE_BOTTOM_NAV.includes(location.pathname);
  const activeNav = getActiveNav(location.pathname);

  // Send driver's location every 10s using browser geolocation
  useEffect(() => {
    if (!driver) return;
    let watchId: number | null = null;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.speed ?? 0, pos.coords.heading ?? 0),
        () => {}, // ignore errors silently
        { enableHighAccuracy: false, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [driver, sendLocation]);

  return (
    <div
      className="w-full min-h-screen mx-auto relative overflow-hidden"
      style={{
        maxWidth: "430px",
        fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
        background: "#0A1628",
      }}
    >
      {/* WS connection dot — bottom-right corner, subtle */}
      <div
        className="fixed bottom-[88px] right-3 z-40 w-2 h-2 rounded-full"
        style={{ background: isConnected ? "#10B981" : "#64748B", opacity: 0.7 }}
        title={isConnected ? "リアルタイム接続中" : "オフライン"}
      />

      {/* Dev: earthquake test button */}
      {!earthquakeAlert && location.pathname === "/" && (
        <button
          onClick={async () => {
            await fetch("http://localhost:8765/dev/fire-alert", { method: "POST" }).catch(() => {});
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-[13px] text-white"
          style={{
            background: "rgba(239, 68, 68, 0.4)",
            border: "1px solid rgba(239, 68, 68, 0.5)",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          ⚠️ 地震デモ
        </button>
      )}

      {/* Earthquake Alert Overlay — driven by real WS event */}
      <AnimatePresence>
        {earthquakeAlert && (
          <EarthquakeAlert
            data={earthquakeAlert}
            onDismiss={dismissAlert}
            onNavigateToSafety={() => {
              dismissAlert();
              navigate("/safety");
            }}
          />
        )}
      </AnimatePresence>

      {/* Screen Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <BottomNav
          active={activeNav}
          onNavigate={(screen) => navigate(`/${screen === "home" ? "" : screen}`)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNav } from "./BottomNav";
import { EarthquakeAlert } from "./EarthquakeAlert";
import { AnimatePresence, motion } from "motion/react";

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
  const [showAlert, setShowAlert] = useState(false);

  const hideBottomNav = HIDE_BOTTOM_NAV.includes(location.pathname);
  const activeNav = getActiveNav(location.pathname);

  return (
    <div
      className="w-full min-h-screen mx-auto relative overflow-hidden"
      style={{
        maxWidth: "430px",
        fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
        background: "#0A1628",
      }}
    >
      {/* Earthquake Alert Demo Button */}
      {!showAlert && location.pathname === "/" && (
        <button
          onClick={() => setShowAlert(true)}
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

      {/* Earthquake Alert Overlay */}
      <AnimatePresence>
        {showAlert && (
          <EarthquakeAlert
            onDismiss={() => setShowAlert(false)}
            onNavigateToSafety={() => {
              setShowAlert(false);
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

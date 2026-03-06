import { Home, Package, Map, User } from "lucide-react";

interface BottomNavProps {
  active: string;
  onNavigate: (screen: string) => void;
}

const navItems = [
  { id: "home", icon: Home, label: "ホーム" },
  { id: "jobs", icon: Package, label: "配送" },
  { id: "map", icon: Map, label: "マップ" },
  { id: "profile", icon: User, label: "プロフィール" },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 backdrop-blur-xl" style={{ background: "rgba(10, 22, 40, 0.95)" }}>
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] max-w-[430px] mx-auto">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-0.5 py-2 px-4 min-w-[64px] transition-colors"
            >
              <item.icon
                size={24}
                className={isActive ? "text-[#06B6D4]" : "text-slate-500"}
              />
              <span
                className={`text-[11px] tracking-wide ${
                  isActive ? "text-[#06B6D4]" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

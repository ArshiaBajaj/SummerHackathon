import { NavLink, Outlet } from "react-router-dom";
import { Home, Crosshair, Radio, BarChart3, Share2, Film } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/film", label: "Film Room", icon: Film },
  { to: "/calibrate", label: "Calibrate", icon: Crosshair },
  { to: "/live", label: "Live", icon: Radio },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Scout Card", icon: Share2 },
];

export function Layout() {
  return (
    <div className="min-h-dvh w-full text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-court-bg/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <NavLink to="/" aria-label="Home">
            <Logo />
          </NavLink>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-court-lime animate-pulse-slow" />
              Edge · Offline-first
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:pt-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-3 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between gap-1 rounded-2xl border border-white/10 bg-court-panel/80 p-1.5 shadow-glow backdrop-blur-lg md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                isActive ? "bg-white/10 text-white" : "text-white/55"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

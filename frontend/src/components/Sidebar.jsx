import {
  LayoutDashboard,
  TriangleAlert,
  Package,
  ClipboardList,
  Truck,
  ShieldCheck,
  Atom,
  LogOut,
  Warehouse,
  X
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen = false, onClose, desktopOpen = true }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const role = user?.role || "NATIONAL_HEAD";

  // Build role-tailored navigation items
  let menuItems = [];

  if (role === "WAREHOUSE_MANAGER") {
    menuItems = [
      {
        name: "Warehouse Hub",
        icon: Warehouse,
        path: "/warehouse-dashboard",
      },
      {
        name: "Movements",
        icon: Truck,
        path: "/movements",
      },
      {
        name: "Resources",
        icon: Package,
        path: "/resources",
      },
      {
        name: "Blockchain Audit",
        icon: ShieldCheck,
        path: "/blockchain",
      },
    ];
  } else if (role === "STATE_HEAD") {
    menuItems = [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        name: "Predictions",
        icon: TriangleAlert,
        path: "/predictions",
      },
      {
        name: "Warehouse Hub",
        icon: Warehouse,
        path: "/warehouse-dashboard",
      },
      {
        name: "Requests",
        icon: ClipboardList,
        path: "/resource-requests",
      },
      {
        name: "Allocations",
        icon: Package,
        path: "/allocations",
      },
      {
        name: "Movements",
        icon: Truck,
        path: "/movements",
      },
      {
        name: "Resources",
        icon: Package,
        path: "/resources",
      },
      {
        name: "Blockchain Audit",
        icon: ShieldCheck,
        path: "/blockchain",
      },
    ];
  } else {
    // NATIONAL_HEAD, DEPARTMENT_HEAD, etc.
    menuItems = [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        name: "Warehouse Hub",
        icon: Warehouse,
        path: "/warehouse-dashboard",
      },
      {
        name: "Predictions",
        icon: TriangleAlert,
        path: "/predictions",
      },
      {
        name: "Resources",
        icon: Package,
        path: "/resources",
      },
      {
        name: "Requests",
        icon: ClipboardList,
        path: "/resource-requests",
      },
      {
        name: "Allocations",
        icon: Package,
        path: "/allocations",
      },
      {
        name: "Movements",
        icon: Truck,
        path: "/movements",
      },
      {
        name: "Blockchain Audit",
        icon: ShieldCheck,
        path: "/blockchain",
      },
      {
        name: "Quantum Optimization",
        icon: Atom,
        path: "/quantum",
      },
    ];
  }

  return (
    <aside
      className={`fixed left-0 top-0 flex h-screen w-64 flex-col bg-slate-950 text-white z-50 transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } ${desktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full"}`}
    >
      {/* Logo & Mobile Close Button */}
      <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-600 p-2 text-white shadow-md shadow-blue-500/20 shrink-0">
            <TriangleAlert size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">
              Disaster Management
            </h1>
            <p className="text-[11px] text-slate-400">
              National Command System
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition lg:hidden"
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* User Info */}
      <div className="border-b border-slate-800/80 px-5 py-3.5 bg-slate-900/40">
        <p className="text-sm font-semibold truncate text-slate-100">
          {user?.fullName || user?.full_name || "Authorized User"}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-medium text-blue-400 truncate">
            {role.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon size={19} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-600/90 hover:text-white transition"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
}
import { useState } from "react";
import { Bell, Search, Shield, PlusCircle, CheckCircle2, Loader2, Sparkles, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Topbar({ onSimulationTrigger, onToggleSidebar }) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [disasterResult, setDisasterResult] = useState(null);

  const fullName = user?.fullName || user?.full_name || "National Officer";
  const initial = fullName.charAt(0).toUpperCase();
  const roleName = (user?.role || "NATIONAL_HEAD").replaceAll("_", " ");

  const handleCreateDisaster = async () => {
    if (creating) return;
    try {
      setCreating(true);
      setDisasterResult(null);
      const res = await api.post("/disasters/create");
      if (res.data.success) {
        setDisasterResult(res.data.scenario);
        if (onSimulationTrigger) onSimulationTrigger(res.data.scenario);
      }
    } catch (err) {
      console.error("Disaster creation error:", err);
      alert(err.response?.data?.message || "Failed to create disaster prediction.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 3-Line Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Toggle navigation menu"
          title="Toggle Menu (3 lines)"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="truncate">Disaster Command</span>
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM OPERATIONAL
            </span>
          </h2>
          <p className="hidden lg:block text-[11px] text-slate-500 font-medium">
            AI Early Warning • Quantum Supply Chain • Hardhat Blockchain Audit
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Create Disaster Prediction Button */}
        <button
          onClick={handleCreateDisaster}
          disabled={creating}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 py-1.5 sm:px-4 text-xs font-bold text-white shadow-sm shadow-red-500/25 hover:from-red-700 hover:to-rose-800 transition disabled:opacity-60 active:scale-95 border border-red-500/30"
          title="Create & Predict New Disaster (Requires manual verification & requests)"
        >
          {creating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span className="hidden sm:inline">Predicting...</span>
            </>
          ) : (
            <>
              <PlusCircle size={15} className="text-white" />
              <span className="hidden sm:inline">Create Disaster</span>
              <span className="sm:hidden">Create</span>
            </>
          )}
        </button>

        {/* Live Subsystem Indicators */}
        <div className="hidden xl:flex items-center gap-2 rounded-lg bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200/60">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ML:8001
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-purple-700">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Quantum:8002
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Chain:8545
          </span>
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{fullName}</p>
            <p className="text-[10px] font-medium text-blue-600 mt-0.5 uppercase tracking-wider">{roleName}</p>
          </div>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs sm:text-sm font-bold text-white shadow-sm shadow-blue-500/20 ring-2 ring-blue-100">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
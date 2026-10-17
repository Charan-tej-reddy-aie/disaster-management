import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { AlertTriangle, CheckCircle, ExternalLink, ArrowRight, ShieldCheck, X } from "lucide-react";

export default function Layout() {
  const [simulationNotice, setSimulationNotice] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(true);
  const location = useLocation();

  // Automatically close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Support pressing Escape to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSimulation = (scenario) => {
    setSimulationNotice(scenario);
  };

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setDesktopMenuOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay (3-line menu closes on tap outside) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Role-Aware Responsive Sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        desktopOpen={desktopMenuOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300 ease-in-out ${
          desktopMenuOpen ? "lg:ml-64" : "lg:ml-0"
        } ml-0`}
      >
        <Topbar
          onSimulationTrigger={handleSimulation}
          onToggleSidebar={toggleSidebar}
        />

        {/* Global Disaster Alert Notification */}
        {simulationNotice && (
          <div className="mx-3 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-red-700/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm shrink-0">
                <AlertTriangle size={22} className="text-amber-200 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight flex flex-wrap items-center gap-2">
                  🚨 New Disaster Alert: {simulationNotice.eventName}
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold">
                    CRITICAL (95%)
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    ID #{simulationNotice.predictionId}
                  </span>
                </h4>
                <p className="text-xs text-rose-100 mt-0.5">
                  Disaster prediction generated for Kerala (~15,000 citizens at risk). No automated requests or allocations made. Open Predictions to manually verify and request relief supplies.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Link
                to="/predictions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-red-700 text-xs font-bold hover:bg-rose-50 transition shadow-sm"
              >
                <span>View in Predictions</span>
                <ArrowRight size={14} />
              </Link>
              <button
                onClick={() => setSimulationNotice(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                title="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="p-3 sm:p-6 flex-1 overflow-x-hidden">
          <Outlet context={{ simulationNotice }} />
        </main>
      </div>
    </div>
  );
}

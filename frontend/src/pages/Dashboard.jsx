import { useEffect, useState } from "react";
import {
  TriangleAlert,
  Activity,
  ClipboardList,
  Warehouse,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import StatCard from "../components/StatCard";
import DisasterAlert from "../components/DisasterAlert";
import DisasterMap from "../components/DisasterMap";

export default function Dashboard() {
  const { user } = useAuth();

  const [predictions, setPredictions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [states, setStates] = useState([]);

  const [statistics, setStatistics] = useState({
    predictions: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    warehouses: 0,
    pendingRequests: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/disasters/dashboard");
      const data = response.data.data;

      setPredictions(data.predictions || []);
      setWarehouses(data.warehouses || []);
      setStates(data.states || []);
      setStatistics(data.statistics || {});
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    try {
      setSimulating(true);
      setSimulationResult(null);

      const res = await api.post("/disasters/simulate-dummy");
      if (res.data.success) {
        setSimulationResult(res.data.scenario);
        await loadDashboard();
      }
    } catch (err) {
      console.error("Simulation error:", err);
      alert(err.response?.data?.message || "Failed to run simulation");
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const fullName = user?.fullName || user?.full_name || "National Disaster Officer";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            National Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{fullName}</span>. Real-time satellite telemetries and automated disaster response center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-purple-700 transition active:scale-95 disabled:opacity-50"
          >
            {simulating ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Simulating Scenario...</span>
              </>
            ) : (
              <>
                <Zap size={17} className="text-amber-300 fill-amber-300" />
                <span>Simulate Live Disaster</span>
              </>
            )}
          </button>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-blue-600" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Simulation Result Banner if executed */}
      {simulationResult && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-600 p-2 text-white shadow-sm">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  Simulation Successful: {simulationResult.eventName}
                  <span className="rounded-full bg-emerald-200/60 text-emerald-800 text-xs px-2.5 py-0.5 font-mono">
                    ID #{simulationResult.predictionId}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-emerald-800">
                  Full chain completed: Prediction ➔ Emergency Request #{simulationResult.requestId} ➔ Quantum QAOA Optimization ➔ Allocation #{simulationResult.allocationId} ➔ Hardhat Blockchain Confirmation!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/blockchain"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <ShieldCheck size={15} />
                View Blockchain Audit
              </Link>
              <button
                onClick={() => setSimulationResult(null)}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Active Predictions"
          value={statistics.predictions || 0}
          subtitle="AI-detected events"
          icon={TriangleAlert}
          iconClass="bg-blue-100 text-blue-600"
        />

        <StatCard
          title="Critical Alerts"
          value={statistics.critical || 0}
          subtitle="Immediate action required"
          icon={Activity}
          iconClass="bg-red-100 text-red-600"
        />

        <StatCard
          title="High Risk Events"
          value={statistics.high || 0}
          subtitle="Severe probability"
          icon={ClipboardList}
          iconClass="bg-orange-100 text-orange-600"
        />

        <StatCard
          title="Warehouses"
          value={statistics.warehouses || 2}
          subtitle="Active logistics hubs"
          icon={Warehouse}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <StatCard
          title="Pending Approvals"
          value={statistics.pendingRequests || 0}
          subtitle="State/National requests"
          icon={Clock}
          iconClass="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Interactive Map */}
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-bold text-slate-800 text-base">
                    National Disaster Geographic Map
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live satellite monitoring, predicted danger zones, and emergency warehouses
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="h-2 w-2 rounded-full bg-red-600 -ml-3.5" />
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span>Warehouse</span>
                  </div>
                </div>
              </div>
            </div>

            <DisasterMap
              states={states}
              predictions={predictions}
              warehouses={warehouses}
            />
          </div>
        </div>

        {/* Disaster Alerts List */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[580px]">
            <div className="border-b border-slate-200/80 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base">
                  Live Early Warnings
                </h2>
                <p className="text-xs text-slate-500">
                  Model forecasts & risk alerts
                </p>
              </div>
              <Link
                to="/predictions"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loading ? (
                <div className="py-20 text-center text-sm text-slate-400">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2 text-blue-600" />
                  Streaming predictions...
                </div>
              ) : predictions.length === 0 ? (
                <div className="py-20 text-center text-sm text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                  No critical disaster warnings currently active
                </div>
              ) : (
                predictions.map((prediction) => (
                  <DisasterAlert
                    key={prediction.prediction_id}
                    prediction={prediction}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Infrastructure Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
            <Layers size={17} className="text-blue-600" />
            Decentralized Architecture Health & Subsystems
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ALL NODES SYNCHRONIZED
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusItem
            name="Backend API Gateway"
            port="5000"
            status="Online (Active)"
            protocol="REST / Node.js"
          />

          <StatusItem
            name="MySQL Database"
            port="3306"
            status="Connected (33 Tables)"
            protocol="Pool Connection"
          />

          <StatusItem
            name="QAOA Quantum Optimizer"
            port="8002"
            status="Ready (Qiskit Engine)"
            protocol="FastAPI Python"
          />

          <StatusItem
            name="Hardhat Blockchain Node"
            port="8545"
            status="Mining (DisasterAudit)"
            protocol="JSON-RPC Local"
          />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ name, port, status, protocol }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{name}</span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {status}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>Port :{port}</span>
        <span>{protocol}</span>
      </div>
    </div>
  );
}
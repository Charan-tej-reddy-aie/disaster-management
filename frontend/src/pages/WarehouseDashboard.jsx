import { useEffect, useState } from "react";
import {
  Warehouse,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Send,
  ArrowRight,
  AlertTriangle,
  ExternalLink,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

function statusBadgeClass(status) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "IN_TRANSIT":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "DISPATCHED":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "PLANNED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function WarehouseDashboard() {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadWarehousesList = async () => {
    try {
      const res = await api.get("/warehouses/managed");
      if (res.data?.success && res.data.data) {
        setAllWarehouses(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load warehouse list:", e.message);
    }
  };

  const loadDashboard = async (whId) => {
    try {
      setLoading(true);
      setError("");
      const url = whId
        ? `/warehouses/manager/dashboard?warehouseId=${whId}`
        : `/warehouses/manager/dashboard`;

      const response = await api.get(url);
      if (response.data?.success) {
        setDashboardData(response.data.data);
        if (!selectedWarehouseId && response.data.data.warehouse) {
          setSelectedWarehouseId(String(response.data.data.warehouse.warehouse_id));
        }
      } else {
        setError(response.data?.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to load warehouse dashboard. Ensure a warehouse is assigned to your account."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehousesList();
    loadDashboard();
  }, []);

  const handleWarehouseChange = (e) => {
    const id = e.target.value;
    setSelectedWarehouseId(id);
    loadDashboard(id);
  };

  const handleMovementAction = async (movementId, action) => {
    try {
      setActionLoading(movementId);
      setError("");
      setSuccessMsg("");

      const res = await api.post(`/resource-movements/${movementId}/${action}`);
      if (res.data?.success) {
        setSuccessMsg(`Movement #${movementId} transitioned to ${res.data.newStatus} successfully! Recorded on Blockchain.`);
        await loadDashboard(selectedWarehouseId);
      }
    } catch (err) {
      console.error("Action error:", err);
      setError(err.response?.data?.message || `Failed to perform ${action} on movement.`);
    } finally {
      setActionLoading(null);
    }
  };

  const warehouse = dashboardData?.warehouse;
  const inventory = dashboardData?.inventory || [];
  const stockSummary = dashboardData?.stockSummary || {};
  const allocations = dashboardData?.allocations || [];
  const movements = dashboardData?.movements || [];
  const movementStats = dashboardData?.movementStats || {};

  return (
    <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Facility Command Hub
                </span>
                {warehouse && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Active & Operational
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {warehouse?.warehouse_name || "Warehouse Manager Dashboard"}
              </h1>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" />
                {warehouse?.address || "Emergency Resource Warehouse"} • {warehouse?.state_name || "State Center"}
                {warehouse?.latitude && (
                  <span className="text-xs text-slate-400 ml-2">
                    ({Number(warehouse.latitude).toFixed(4)}°N, {Number(warehouse.longitude).toFixed(4)}°E)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Warehouse selector for National Head or Multi-facility managers */}
              {allWarehouses.length > 1 && (
                <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 border border-white/20">
                  <span className="text-xs text-slate-300 font-medium">Facility:</span>
                  <select
                    value={selectedWarehouseId}
                    onChange={handleWarehouseChange}
                    className="bg-transparent text-sm text-white font-semibold outline-none cursor-pointer"
                  >
                    {allWarehouses.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id} className="text-slate-900">
                        {w.warehouse_name} ({w.state_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => loadDashboard(selectedWarehouseId)}
                disabled={loading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition border border-white/20"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Available Stock"
              value={stockSummary.totalAvailable?.toLocaleString() || "0"}
              subtitle="Physical units in warehouse"
              icon={Package}
              iconClass="bg-blue-100 text-blue-700"
            />
            <StatCard
              title="Reserved For Emergencies"
              value={stockSummary.totalReserved?.toLocaleString() || "0"}
              subtitle="Committed to approved allocations"
              icon={Clock}
              iconClass="bg-amber-100 text-amber-700"
            />
            <StatCard
              title="Usable Free Stock"
              value={stockSummary.totalUsable?.toLocaleString() || "0"}
              subtitle="Available for new dispatch"
              icon={CheckCircle2}
              iconClass="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              title="Active Movement Operations"
              value={
                (movementStats.planned || 0) +
                (movementStats.dispatched || 0) +
                (movementStats.inTransit || 0)
              }
              subtitle={`${movementStats.delivered || 0} already delivered`}
              icon={Truck}
              iconClass="bg-purple-100 text-purple-700"
            />
          </div>

          {/* Main Grid: Inventory & Allocations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Table (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Warehouse Inventory & Usable Stock
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live inventory balance with emergency reservations deducted
                  </p>
                </div>
                <Link
                  to="/resources"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Global Inventory <ArrowRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Resource</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5 text-right">Available</th>
                      <th className="px-4 py-3.5 text-right">Reserved</th>
                      <th className="px-4 py-3.5 text-right">Usable</th>
                      <th className="px-5 py-3.5">Capacity Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No resource stock recorded for this warehouse.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item) => {
                        const total = Number(item.quantity_available || 0);
                        const reserved = Number(item.quantity_reserved || 0);
                        const usable = Number(item.quantity_usable || 0);
                        const usablePercent = total > 0 ? Math.round((usable / total) * 100) : 0;

                        return (
                          <tr key={item.warehouse_resource_id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              {item.resource_name}
                              <span className="block text-xs font-normal text-slate-400">
                                Unit: {item.unit}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-xs font-medium text-slate-600">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-md">
                                {item.category_name}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-700">
                              {total.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-amber-600">
                              {reserved.toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-emerald-600">
                              {usable.toLocaleString()}
                            </td>
                            <td className="px-5 py-4">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                                  <span>{usablePercent}% Free</span>
                                </div>
                                <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden flex">
                                  <div
                                    className="bg-emerald-500 h-full"
                                    style={{ width: `${usablePercent}%` }}
                                    title={`${usablePercent}% usable`}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assigned Emergency Allocations (1 col) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Layers size={20} className="text-indigo-600" />
                    Allocations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Orders assigned to this warehouse
                  </p>
                </div>
                <Link
                  to="/allocations"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View All
                </Link>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3 max-h-[420px]">
                {allocations.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No active allocations assigned to this warehouse.
                  </div>
                ) : (
                  allocations.map((alloc) => (
                    <div
                      key={alloc.allocation_id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">
                          Allocation #{alloc.allocation_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass(alloc.allocation_status)}`}>
                          {alloc.allocation_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {alloc.reason || "Disaster relief allocation"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Target: {alloc.target_state}</span>
                        <span className="font-medium text-slate-700">
                          {Number(alloc.warehouse_allocated_qty || 0).toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dispatch & Movement Tracker Command Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Truck size={20} className="text-purple-600" />
                  Dispatch & Movement Operations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track dispatches, advance movement statuses, and cryptographically verify on Blockchain
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-lg font-semibold border border-purple-200">
                  {movementStats.total || 0} Total Dispatches
                </span>
                <Link
                  to="/blockchain"
                  className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg font-semibold transition"
                >
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Blockchain Audit
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">ID / Ref</th>
                    <th className="px-4 py-3.5">Resource & Qty</th>
                    <th className="px-4 py-3.5">Destination</th>
                    <th className="px-4 py-3.5">Tracking Number</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Blockchain Tx</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No resource movements found for this facility.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.movement_id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          #{m.movement_id}
                          <span className="block text-[11px] font-normal text-slate-400">
                            Alloc #{m.allocation_id}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-800">
                            {Number(m.quantity).toLocaleString()} {m.unit}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {m.resource_name}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                          {m.destination_state}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-600">
                          {m.tracking_reference || (
                            <span className="text-slate-400 italic">Pending dispatch</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass(m.movement_status)}`}>
                            {m.movement_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {m.blockchain_tx_hash ? (
                            <Link
                              to="/blockchain"
                              title={m.blockchain_tx_hash}
                              className="font-mono text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                              {m.blockchain_tx_hash.substring(0, 10)}...
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unrecorded</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {m.movement_status === "PLANNED" && (
                            <button
                              onClick={() => handleMovementAction(m.movement_id, "dispatch")}
                              disabled={actionLoading === m.movement_id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                            >
                              <Send size={13} />
                              Dispatch
                            </button>
                          )}

                          {m.movement_status === "DISPATCHED" && (
                            <button
                              onClick={() => handleMovementAction(m.movement_id, "in-transit")}
                              disabled={actionLoading === m.movement_id}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                            >
                              <Truck size={13} />
                              In Transit
                            </button>
                          )}

                          {m.movement_status === "IN_TRANSIT" && (
                            <button
                              onClick={() => handleMovementAction(m.movement_id, "deliver")}
                              disabled={actionLoading === m.movement_id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                            >
                              <CheckCircle2 size={13} />
                              Delivered
                            </button>
                          )}

                          {m.movement_status === "DELIVERED" && (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 justify-end">
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </div>
        </div>
    </div>
  );
}

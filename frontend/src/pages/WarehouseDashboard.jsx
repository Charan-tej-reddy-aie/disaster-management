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
  Layers,
  PlusCircle,
  X,
  ShieldAlert
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

  // Stock Replenishment & Allotment State
  const [stockRequests, setStockRequests] = useState([]);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [allotModalOpen, setAllotModalOpen] = useState(false);
  const [selectedStockReq, setSelectedStockReq] = useState(null);
  const [allotQty, setAllotQty] = useState("");
  const [allotSource, setAllotSource] = useState("Central National Emergency Reserve");
  const [isSubmittingStockReq, setIsSubmittingStockReq] = useState(false);
  const [isAllotting, setIsAllotting] = useState(false);

  // Form for requesting stock
  const [stockForm, setStockForm] = useState({
    resourceId: "1",
    quantity: "5000",
    priority: "CRITICAL",
    source: "Central National Emergency Reserve",
    reason: ""
  });

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

  const loadStockRequests = async (whId) => {
    try {
      const url = whId
        ? `/warehouses/stock-requests?warehouseId=${whId}`
        : `/warehouses/stock-requests`;
      const res = await api.get(url);
      if (res.data?.success) {
        setStockRequests(res.data.data || []);
      }
    } catch (e) {
      console.warn("Could not load stock requests:", e.message);
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
        const activeWhId = whId || (response.data.data.warehouse ? String(response.data.data.warehouse.warehouse_id) : "");
        if (!selectedWarehouseId && activeWhId) {
          setSelectedWarehouseId(activeWhId);
        }
        await loadStockRequests(activeWhId);
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
    loadStockRequests(id);
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

  // Submit new stock replenishment request
  const handleSubmitStockRequest = async (e) => {
    e.preventDefault();
    if (!stockForm.quantity || Number(stockForm.quantity) <= 0) {
      alert("Please enter a valid quantity to request.");
      return;
    }
    const targetWhId = selectedWarehouseId || warehouse?.warehouse_id;
    if (!targetWhId) {
      alert("Please select a target warehouse.");
      return;
    }

    try {
      setIsSubmittingStockReq(true);
      setError("");
      const res = await api.post("/warehouses/stock-request", {
        warehouseId: Number(targetWhId),
        resourceId: Number(stockForm.resourceId),
        quantityRequested: Number(stockForm.quantity),
        priority: stockForm.priority,
        reason: stockForm.reason || "Warehouse stock depletion emergency replenishment",
        allotmentSource: stockForm.source
      });

      if (res.data?.success) {
        setSuccessMsg("Stock replenishment request submitted successfully! Awaiting allotment by National Authority.");
        setStockModalOpen(false);
        setStockForm({
          resourceId: "1",
          quantity: "5000",
          priority: "CRITICAL",
          source: "Central National Emergency Reserve",
          reason: ""
        });
        await loadStockRequests(targetWhId);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit stock request");
    } finally {
      setIsSubmittingStockReq(false);
    }
  };

  // Allot requested stock to warehouse
  const handleConfirmAllotment = async () => {
    if (!selectedStockReq) return;
    try {
      setIsAllotting(true);
      setError("");
      const res = await api.post(`/warehouses/stock-requests/${selectedStockReq.stock_request_id}/allot`, {
        quantityAllotted: allotQty ? Number(allotQty) : Number(selectedStockReq.quantity_requested),
        source: allotSource
      });

      if (res.data?.success) {
        setSuccessMsg(`Stock Allotted! ${Number(allotQty || selectedStockReq.quantity_requested).toLocaleString()} units credited to warehouse from ${allotSource}. Physical inventory updated on blockchain!`);
        setAllotModalOpen(false);
        setSelectedStockReq(null);
        await loadDashboard(selectedWarehouseId || warehouse?.warehouse_id);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to allot stock");
    } finally {
      setIsAllotting(false);
    }
  };

  const openRestockForMovement = (m, whStock, shortfall) => {
    setStockForm({
      resourceId: String(m.resource_id),
      quantity: String(Math.max(shortfall || 1000, 1000)),
      priority: "CRITICAL",
      source: "Central National Emergency Reserve",
      reason: `Immediate replenishment required for Movement #${m.movement_id} to ${m.destination_state} (Shortfall: ${shortfall?.toLocaleString() || 'insufficient'} ${m.unit})`
    });
    setStockModalOpen(true);
  };

  const openRestockForResource = (item) => {
    setStockForm({
      resourceId: String(item.resource_id),
      quantity: "5000",
      priority: "HIGH",
      source: "Central National Emergency Reserve",
      reason: `Depleted warehouse inventory for ${item.resource_name} (Current usable: ${Number(item.quantity_usable || 0).toLocaleString()} ${item.unit})`
    });
    setStockModalOpen(true);
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
              {/* Request Stock Replenishment Button */}
              <button
                onClick={() => {
                  setStockForm({
                    resourceId: "1",
                    quantity: "5000",
                    priority: "CRITICAL",
                    source: "Central National Emergency Reserve",
                    reason: `Emergency stock replenishment for ${warehouse?.warehouse_name || 'warehouse'}`
                  });
                  setStockModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm active:scale-95 border border-amber-400/30"
                title="Request stock replenishment from Central Reserve when inventory runs low or is depleted"
              >
                <PlusCircle size={15} />
                <span>Request Restock</span>
              </button>

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
                              <div className="flex items-center justify-between gap-3">
                                <div className="w-24 space-y-1">
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
                                <button
                                  onClick={() => openRestockForResource(item)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition whitespace-nowrap active:scale-95 shadow-2xs"
                                  title="Request replenishment for this resource from Central Reserve"
                                >
                                  + Restock
                                </button>
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
                          {m.movement_status === "PLANNED" && (() => {
                            const whStock = inventory.find((inv) => Number(inv.resource_id) === Number(m.resource_id));
                            const availableQty = Number(whStock?.quantity_available || 0);
                            const requiredQty = Number(m.quantity || 0);
                            const hasStock = availableQty >= requiredQty;

                            if (!hasStock) {
                              const shortfall = requiredQty - availableQty;
                              return (
                                <div className="flex flex-col items-end gap-1">
                                  <button
                                    onClick={() => openRestockForMovement(m, whStock, shortfall)}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 ml-auto"
                                    title={`Insufficient stock! (Available: ${availableQty.toLocaleString()}, Needed: ${requiredQty.toLocaleString()}). Click to request emergency replenishment!`}
                                  >
                                    <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                                    <span>Out of Stock • Request Restock</span>
                                  </button>
                                  <span className="text-[10px] text-amber-700 font-medium">
                                    Shortfall: {shortfall.toLocaleString()} {m.unit}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => handleMovementAction(m.movement_id, "dispatch")}
                                disabled={actionLoading === m.movement_id}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ml-auto active:scale-95"
                              >
                                <Send size={13} />
                                Dispatch
                              </button>
                            );
                          })()}

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

        {/* Warehouse Stock Requisitions & Central Allotments Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-amber-50/20 to-blue-50/20">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package size={20} className="text-amber-600" />
                Facility Stock Replenishment & Central Allotments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Requisition supplies when warehouse stock is exhausted, and allot inventory from Central National Reserve or Inter-Warehouse transfer
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStockForm({
                    resourceId: "1",
                    quantity: "5000",
                    priority: "CRITICAL",
                    source: "Central National Emergency Reserve",
                    reason: `Stock replenishment for ${warehouse?.warehouse_name || 'facility'}`
                  });
                  setStockModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-sm transition active:scale-95"
              >
                <PlusCircle size={14} />
                Request Stock Replenishment
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Requisition ID</th>
                  <th className="px-4 py-3.5">Facility</th>
                  <th className="px-4 py-3.5">Resource & Qty</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Source Depot</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Allotment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No active stock replenishment requests for this facility. Click "+ Request Stock Replenishment" to requisition supplies.
                    </td>
                  </tr>
                ) : (
                  stockRequests.map((sr) => (
                    <tr key={sr.stock_request_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        #SR-{sr.stock_request_id}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {new Date(sr.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-700">
                        {sr.warehouse_name}
                        <span className="block text-[11px] text-slate-400">{sr.state_name}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-900">
                          {Number(sr.quantity_requested).toLocaleString()} {sr.unit}
                        </span>
                        <span className="block text-xs text-slate-500 font-medium">
                          {sr.resource_name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          sr.priority === "CRITICAL" ? "bg-red-100 text-red-700 border border-red-200" :
                          sr.priority === "HIGH" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                          "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}>
                          {sr.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 font-medium">
                        {sr.allotment_source || "Central National Reserve"}
                      </td>
                      <td className="px-4 py-4">
                        {sr.status === "ALLOTTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            ALLOTTED ({Number(sr.quantity_allotted || sr.quantity_requested).toLocaleString()})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock size={13} className="text-amber-600" />
                            PENDING ALLOTMENT
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {sr.status === "PENDING_ALLOTMENT" ? (
                          <button
                            onClick={() => {
                              setSelectedStockReq(sr);
                              setAllotQty(String(sr.quantity_requested));
                              setAllotSource(sr.allotment_source || "Central National Emergency Reserve");
                              setAllotModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition active:scale-95 inline-flex items-center gap-1.5 ml-auto"
                          >
                            <ShieldCheck size={14} />
                            Allot Stock
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1">
                            <ShieldCheck size={13} className="text-emerald-500" />
                            Credited by {sr.allotted_by_name || "National Command"}
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

      {/* Modal 1: Request Stock Replenishment Modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Request Stock Replenishment</h3>
                  <p className="text-xs text-slate-300">Requisition supplies when warehouse resources are depleted</p>
                </div>
              </div>
              <button
                onClick={() => setStockModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStockRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requesting Facility
                </label>
                <input
                  type="text"
                  disabled
                  value={`${warehouse?.warehouse_name || 'Selected Warehouse'} (${warehouse?.state_name || 'State Center'})`}
                  className="w-full px-3 py-2 text-sm bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Relief Resource
                  </label>
                  <select
                    value={stockForm.resourceId}
                    onChange={(e) => setStockForm({ ...stockForm, resourceId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="1">Food Kit (Kits)</option>
                    <option value="2">Drinking Water (Litres)</option>
                    <option value="3">Medical Kit (Kits)</option>
                    <option value="4">Rescue Boat (Units)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Urgency Priority
                  </label>
                  <select
                    value={stockForm.priority}
                    onChange={(e) => setStockForm({ ...stockForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                    <option value="HIGH">HIGH (Standard Emergency)</option>
                    <option value="MEDIUM">MEDIUM (Buffer)</option>
                    <option value="LOW">LOW (Regular)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Source Requisition
                  </label>
                  <select
                    value={stockForm.source}
                    onChange={(e) => setStockForm({ ...stockForm, source: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="Central National Emergency Reserve">Central National Reserve</option>
                    <option value="Inter-Warehouse Transfer: Tamil Nadu Central Warehouse">Inter-Warehouse: Tamil Nadu</option>
                    <option value="Inter-Warehouse Transfer: Karnataka Regional Depot">Inter-Warehouse: Karnataka</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Justification / Operational Reason
                </label>
                <textarea
                  rows="3"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  placeholder="Detail why additional stock is needed (e.g. stock depleted, pending disaster movement dispatch)..."
                  className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStockReq}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isSubmittingStockReq ? "Submitting..." : "Submit Requisition"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Allot Emergency Stock Modal */}
      {allotModalOpen && selectedStockReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Allot Emergency Supplies</h3>
                  <p className="text-xs text-emerald-200">Requisition #{selectedStockReq.stock_request_id} • {selectedStockReq.warehouse_name}</p>
                </div>
              </div>
              <button
                onClick={() => setAllotModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Requested By:</span>
                  <span className="text-emerald-950 font-bold">{selectedStockReq.requested_by_name || 'Warehouse Manager'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Resource Item:</span>
                  <span className="text-emerald-950 font-bold">{selectedStockReq.resource_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-800 font-semibold">Requisitioned Qty:</span>
                  <span className="text-emerald-950 font-bold text-sm">
                    {Number(selectedStockReq.quantity_requested).toLocaleString()} {selectedStockReq.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Allotment Source Depot
                </label>
                <select
                  value={allotSource}
                  onChange={(e) => setAllotSource(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                >
                  <option value="Central National Emergency Reserve">Central National Emergency Reserve (Government Strategic Stock)</option>
                  <option value="Inter-Warehouse Transfer: Tamil Nadu Central Warehouse">Inter-Warehouse Transfer: Tamil Nadu Central Warehouse</option>
                  <option value="Inter-Warehouse Transfer: Karnataka Regional Depot">Inter-Warehouse Transfer: Karnataka Regional Depot</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approved Allotment Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={allotQty}
                  onChange={(e) => setAllotQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-base"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Once confirmed, this exact quantity will be credited immediately to the warehouse inventory and recorded on Blockchain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAllotModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllotment}
                  disabled={isAllotting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} />
                  <span>{isAllotting ? "Allotting..." : "Confirm & Allot Stock"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Truck,
  RefreshCw,
  PackageCheck,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";


function statusClass(status) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700";

    case "IN_TRANSIT":
      return "bg-blue-100 text-blue-700";

    case "DISPATCHED":
      return "bg-yellow-100 text-yellow-700";

    case "PLANNED":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}


function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString();
}


export default function Movements() {

  const [allocationId, setAllocationId] = useState("3");
  const [allocationsList, setAllocationsList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const loadAllocationsList = async () => {
    try {
      const res = await api.get("/allocations/all");
      if (res.data?.success && res.data.data) {
        setAllocationsList(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load allocations list:", e);
    }
  };

  const loadMovements = async (idToLoad) => {
    const targetId = idToLoad !== undefined ? idToLoad : allocationId;
    if (!targetId) {
      setError("Enter or select an allocation ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/resource-movements/allocation/${targetId}`
      );

      setMovements(response.data.movements || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Failed to load movements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllocationsList();
    loadMovements("3");
  }, []);


  const updateMovement = async (
    movementId,
    action
  ) => {

    try {

      setActionLoading(movementId);
      setError("");

      await api.post(
        `/resource-movements/${movementId}/${action}`
      );

      await loadMovements();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to update movement."
      );

    } finally {

      setActionLoading(null);

    }
  };


  const getNextAction = (movement) => {

    if (movement.movement_status === "PLANNED") {
      return {
        label: "Dispatch",
        action: "dispatch",
      };
    }

    if (movement.movement_status === "DISPATCHED") {
      return {
        label: "Mark In Transit",
        action: "in-transit",
      };
    }

    if (movement.movement_status === "IN_TRANSIT") {
      return {
        label: "Confirm Delivery",
        action: "deliver",
      };
    }

    return null;
  };


  return (

    <div className="min-h-screen bg-slate-100">

      <main className="ml-64 p-8">

        {/* Header */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-blue-600 p-3 text-white">
                <Truck size={24} />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Resource Movements
                </h1>

                <p className="text-sm text-slate-500">
                  Track emergency resource transportation
                </p>

              </div>

            </div>

          </div>


          <button
            onClick={loadMovements}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>


        {/* Allocation selector */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            {allocationsList.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select Allocation
                </label>
                <select
                  value={allocationId}
                  onChange={(e) => {
                    setAllocationId(e.target.value);
                    loadMovements(e.target.value);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 text-sm bg-white cursor-pointer"
                >
                  {allocationsList.map((a) => (
                    <option key={a.allocation_id} value={a.allocation_id}>
                      Allocation #{a.allocation_id} ({a.allocation_status}) - Request #{a.resource_request_id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Allocation ID
              </label>
              <input
                type="number"
                min="1"
                value={allocationId}
                onChange={(e) => setAllocationId(e.target.value)}
                className="w-32 rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <button
              onClick={() => loadMovements()}
              className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 text-sm transition"
            >
              Load Movements
            </button>
          </div>
        </div>


        {/* Error */}

        {error && (

          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>

        )}


        {/* Summary */}

        <div className="mb-6 grid gap-4 md:grid-cols-4">

          <SummaryCard
            icon={Truck}
            label="Total Movements"
            value={movements.length}
          />

          <SummaryCard
            icon={Clock}
            label="Planned"
            value={
              movements.filter(
                (m) =>
                  m.movement_status === "PLANNED"
              ).length
            }
          />

          <SummaryCard
            icon={PackageCheck}
            label="In Transit"
            value={
              movements.filter(
                (m) =>
                  m.movement_status === "IN_TRANSIT"
              ).length
            }
          />

          <SummaryCard
            icon={ShieldCheck}
            label="Delivered"
            value={
              movements.filter(
                (m) =>
                  m.movement_status === "DELIVERED"
              ).length
            }
          />

        </div>


        {/* Table */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-4">

            <h2 className="font-semibold text-slate-900">
              Allocation #{allocationId} Movements
            </h2>

          </div>


          {loading ? (

            <div className="flex items-center justify-center p-12 text-slate-500">
              <RefreshCw
                size={22}
                className="mr-3 animate-spin"
              />
              Loading movements...
            </div>

          ) : movements.length === 0 ? (

            <div className="p-12 text-center text-slate-500">
              No movements found for this allocation.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Movement
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Resource
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Warehouse
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Destination
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Quantity
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Tracking
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {movements.map((movement) => {

                    const nextAction =
                      getNextAction(movement);

                    return (

                      <tr
                        key={movement.movement_id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <div className="font-semibold text-slate-900">
                            #{movement.movement_id}
                          </div>

                          <div className="text-xs text-slate-400">
                            Allocation #{movement.allocation_id}
                          </div>

                        </td>


                        <td className="px-6 py-4">

                          <div className="font-medium text-slate-800">
                            {movement.resource_name}
                          </div>

                          <div className="text-xs text-slate-400">
                            {movement.resource_id}
                          </div>

                        </td>


                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-700">

                            <MapPin size={15} />

                            {movement.warehouse_name}

                          </div>

                        </td>


                        <td className="px-6 py-4">

                          <div className="text-sm text-slate-700">
                            {movement.state_name}
                          </div>

                          {movement.to_district_id && (

                            <div className="text-xs text-slate-400">
                              District #{movement.to_district_id}
                            </div>

                          )}

                        </td>


                        <td className="px-6 py-4">

                          <span className="font-semibold text-slate-900">
                            {Number(
                              movement.quantity
                            ).toLocaleString()}
                          </span>

                          <span className="ml-1 text-xs text-slate-400">
                            {movement.unit}
                          </span>

                        </td>


                        <td className="px-6 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              movement.movement_status
                            )}`}
                          >
                            {movement.movement_status}
                          </span>

                        </td>


                        <td className="px-6 py-4">

                          <span className="font-mono text-xs text-slate-600">
                            {movement.tracking_reference || "-"}
                          </span>

                        </td>


                        <td className="px-6 py-4">

                          {nextAction ? (

                            <button
                              disabled={
                                actionLoading ===
                                movement.movement_id
                              }
                              onClick={() =>
                                updateMovement(
                                  movement.movement_id,
                                  nextAction.action
                                )
                              }
                              className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >

                              {actionLoading ===
                              movement.movement_id
                                ? "Updating..."
                                : nextAction.label}

                            </button>

                          ) : (

                            <span className="text-xs text-green-600">
                              Completed
                            </span>

                          )}

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* Timeline */}

        {movements.length > 0 && (

          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Movement Lifecycle
            </h2>

            <div className="grid gap-4 md:grid-cols-4">

              {[
                ["PLANNED", "Allocation created"],
                ["DISPATCHED", "Stock leaves warehouse"],
                ["IN_TRANSIT", "Resource is being transported"],
                ["DELIVERED", "Resource received"],
              ].map(([status, description]) => (

                <div
                  key={status}
                  className="rounded-lg border border-slate-200 p-4"
                >

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      status
                    )}`}
                  >
                    {status}
                  </span>

                  <p className="mt-3 text-sm text-slate-500">
                    {description}
                  </p>

                </div>

              ))}

            </div>

          </div>

        )}

      </main>

    </div>

  );
}


function SummaryCard({
  icon: Icon,
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-white p-5 shadow-sm">

      <div className="mb-3 flex items-center justify-between">

        <span className="text-sm text-slate-500">
          {label}
        </span>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Icon size={18} />
        </div>

      </div>

      <p className="text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>

  );
}
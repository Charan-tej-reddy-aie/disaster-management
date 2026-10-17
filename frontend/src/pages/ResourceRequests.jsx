import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  XCircle,
  Plus
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const styles = {
    PENDING_STATE_APPROVAL:
      "bg-yellow-100 text-yellow-800",

    STATE_APPROVED:
      "bg-blue-100 text-blue-800",

    STATE_REJECTED:
      "bg-red-100 text-red-800",

    PENDING_NATIONAL_APPROVAL:
      "bg-orange-100 text-orange-800",

    NATIONAL_APPROVED:
      "bg-green-100 text-green-800",

    NATIONAL_REJECTED:
      "bg-red-100 text-red-800",

    ALLOCATED:
      "bg-purple-100 text-purple-800",

    COMPLETED:
      "bg-emerald-100 text-emerald-800",

    CANCELLED:
      "bg-gray-100 text-gray-800"
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-gray-100 text-gray-800"
      }`}
    >
      {(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}


// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({ priority }) {
  const styles = {
    LOW:
      "bg-gray-100 text-gray-700",

    MEDIUM:
      "bg-blue-100 text-blue-700",

    HIGH:
      "bg-orange-100 text-orange-700",

    CRITICAL:
      "bg-red-100 text-red-700"
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[priority] ||
        "bg-gray-100 text-gray-700"
      }`}
    >
      {priority || "MEDIUM"}
    </span>
  );
}


// ============================================================
// REQUEST CARD
// ============================================================

function RequestCard({
  request,
  role,
  onApprove,
  onReject,
  actionLoading
}) {

  const requestId =
    request.resource_request_id;

  const status =
    request.request_status;

  const predictionId =
    request.prediction_id;

  const priority =
    request.priority || "MEDIUM";

  const items =
    request.items || [];


  const canStateApprove =
    role === "STATE_HEAD" &&
    status === "PENDING_STATE_APPROVAL";

  const canNationalApprove =
    role === "NATIONAL_HEAD" &&
    status === "PENDING_NATIONAL_APPROVAL";


  const canApprove =
    canStateApprove ||
    canNationalApprove;


  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="border-b border-gray-100 p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-lg font-bold text-gray-900">
                Resource Request #{requestId}
              </h2>

              <StatusBadge
                status={status}
              />

              <PriorityBadge
                priority={priority}
              />

            </div>


            <p className="mt-2 text-sm text-gray-500">

              Prediction #{predictionId}

              {request.state_name && (
                <>
                  {" • "}
                  {request.state_name}
                </>
              )}

            </p>

          </div>


          {/* ACTION BUTTONS */}

          {canApprove && (
            <div className="flex gap-2">

              <button
                onClick={() =>
                  onApprove(requestId)
                }
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={16} />

                {actionLoading
                  ? "Processing..."
                  : "Approve"}
              </button>


              <button
                onClick={() =>
                  onReject(requestId)
                }
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={16} />

                Reject
              </button>

            </div>
          )}

        </div>

      </div>


      {/* ================================================== */}
      {/* REQUEST DETAILS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 gap-4 border-b border-gray-100 p-5 md:grid-cols-3">

        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">
            Disaster
          </p>

          <p className="mt-1 font-semibold text-gray-800">
            {request.disaster_name || "Unknown"}
          </p>
        </div>


        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">
            Severity
          </p>

          <p className="mt-1 font-semibold text-gray-800">
            {request.severity || "-"}
          </p>
        </div>


        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">
            Affected Population
          </p>

          <p className="mt-1 font-semibold text-gray-800">
            {request.affected_population != null
              ? Number(
                  request.affected_population
                ).toLocaleString()
              : "-"}
          </p>
        </div>

      </div>


      {/* ================================================== */}
      {/* REASON */}
      {/* ================================================== */}

      <div className="border-b border-gray-100 p-5">

        <p className="text-xs font-semibold uppercase text-gray-400">
          Reason
        </p>

        <p className="mt-2 text-sm text-gray-700">
          {request.reason ||
            "No reason provided"}
        </p>

      </div>


      {/* ================================================== */}
      {/* RESOURCE ITEMS */}
      {/* ================================================== */}

      <div className="p-5">

        <div className="mb-4 flex items-center gap-2">

          <Package
            size={18}
            className="text-blue-600"
          />

          <h3 className="font-semibold text-gray-900">
            Requested Resources
          </h3>

        </div>


        {items.length === 0 ? (

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No resource items available.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>

                <tr className="border-b border-gray-200 text-xs uppercase text-gray-400">

                  <th className="pb-3">
                    Resource
                  </th>

                  <th className="pb-3">
                    Unit
                  </th>

                  <th className="pb-3">
                    Requested
                  </th>

                  <th className="pb-3">
                    Approved
                  </th>

                </tr>

              </thead>


              <tbody>

                {items.map((item) => (

                  <tr
                    key={
                      item.request_item_id
                    }
                    className="border-b border-gray-100 last:border-0"
                  >

                    <td className="py-3 font-medium text-gray-800">

                      {item.resource_name ||
                        `Resource #${item.resource_id}`}

                    </td>


                    <td className="py-3 text-gray-500">

                      {item.unit || "-"}

                    </td>


                    <td className="py-3 font-semibold">

                      {Number(
                        item.quantity_requested || 0
                      ).toLocaleString()}

                    </td>


                    <td className="py-3">

                      {Number(
                        item.quantity_approved || 0
                      ).toLocaleString()}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function ResourceRequests() {

  const { user } = useAuth();

  const role =
    user?.role;


  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [filter, setFilter] =
    useState("ALL");


  // ==========================================================
  // LOAD REQUESTS
  // ==========================================================

  const loadRequests = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/resource-requests/all"
        );


      const data =
        response.data?.data || [];


      setRequests(data);

    } catch (err) {

      console.error(
        "Failed to load resource requests:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load resource requests"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadRequests();

  }, []);


  // ==========================================================
  // APPROVE
  // ==========================================================

  const handleApprove = async (
    requestId
  ) => {

    try {

      setActionLoading(true);

      if (
        role === "STATE_HEAD"
      ) {

        await api.post(
          `/resource-requests/${requestId}/state-approve`
        );

      } else if (
        role === "NATIONAL_HEAD"
      ) {

        await api.post(
          `/resource-requests/national/${requestId}/approve`
        );

      }

      await loadRequests();

    } catch (err) {

      console.error(
        "Approval error:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to approve request"
      );

    } finally {

      setActionLoading(false);

    }
  };


  // ==========================================================
  // REJECT
  // ==========================================================

  const handleReject = async (
    requestId
  ) => {

    const comments =
      window.prompt(
        "Enter rejection reason:"
      );


    if (
      comments === null
    ) {
      return;
    }


    try {

      setActionLoading(true);

      if (
        role === "STATE_HEAD"
      ) {

        await api.post(
          `/resource-requests/${requestId}/state-reject`,
          {
            comments
          }
        );

      } else if (
        role === "NATIONAL_HEAD"
      ) {

        await api.post(
          `/resource-requests/national/${requestId}/reject`,
          {
            comments
          }
        );

      }

      await loadRequests();

    } catch (err) {

      console.error(
        "Rejection error:",
        err
      );

      alert(
        err.response?.data?.message ||
        "Failed to reject request"
      );

    } finally {

      setActionLoading(false);

    }
  };


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredRequests =
    useMemo(() => {

      if (
        filter === "ALL"
      ) {
        return requests;
      }

      return requests.filter(
        request =>
          request.request_status ===
          filter
      );

    }, [requests, filter]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {

    return {
      total:
        requests.length,

      pendingState:
        requests.filter(
          r =>
            r.request_status ===
            "PENDING_STATE_APPROVAL"
        ).length,

      pendingNational:
        requests.filter(
          r =>
            r.request_status ===
            "PENDING_NATIONAL_APPROVAL"
        ).length,

      allocated:
        requests.filter(
          r =>
            r.request_status ===
            "ALLOCATED"
        ).length,

      completed:
        requests.filter(
          r =>
            r.request_status ===
            "COMPLETED"
        ).length
    };

  }, [requests]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="flex items-center gap-3 text-gray-600">

          <RefreshCw
            size={20}
            className="animate-spin"
          />

          Loading resource requests...

        </div>

      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">
            Resource Requests
          </h1>

          <p className="mt-1 text-gray-500">
            Monitor, review and approve disaster resource requests.
          </p>

        </div>


        <div className="flex items-center gap-3">
          <Link
            to="/resource-requests/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Create Request
          </Link>

          <button
            onClick={loadRequests}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

      </div>


      {/* ==================================================== */}
      {/* STATISTICS */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.total}
          </p>

        </div>


        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

          <p className="text-sm text-yellow-700">
            State Approval
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-800">
            {statistics.pendingState}
          </p>

        </div>


        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">

          <p className="text-sm text-orange-700">
            National Approval
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-800">
            {statistics.pendingNational}
          </p>

        </div>


        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

          <p className="text-sm text-purple-700">
            Allocated
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-800">
            {statistics.allocated}
          </p>

        </div>


        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

          <p className="text-sm text-green-700">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-green-800">
            {statistics.completed}
          </p>

        </div>

      </div>


      {/* ==================================================== */}
      {/* ERROR */}
      {/* ==================================================== */}

      {error && (

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-semibold">
              Failed to load requests
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* ==================================================== */}
      {/* FILTERS */}
      {/* ==================================================== */}

      <div className="flex flex-wrap gap-2">

        {[
          ["ALL", "All"],
          [
            "PENDING_STATE_APPROVAL",
            "State Pending"
          ],
          [
            "PENDING_NATIONAL_APPROVAL",
            "National Pending"
          ],
          [
            "ALLOCATED",
            "Allocated"
          ],
          [
            "COMPLETED",
            "Completed"
          ],
          [
            "STATE_REJECTED",
            "Rejected"
          ],
          [
            "NATIONAL_REJECTED",
            "National Rejected"
          ]
        ].map(
          ([value, label]) => (

            <button
              key={value}
              onClick={() =>
                setFilter(value)
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>

          )
        )}

      </div>


      {/* ==================================================== */}
      {/* REQUEST LIST */}
      {/* ==================================================== */}

      {filteredRequests.length === 0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <Clock
            size={40}
            className="mx-auto text-gray-300"
          />

          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            No resource requests found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            There are no requests matching the selected filter.
          </p>

        </div>

      ) : (

        <div className="space-y-5">

          {filteredRequests.map(
            request => (

              <RequestCard
                key={
                  request.resource_request_id
                }
                request={request}
                role={role}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
              />

            )
          )}

        </div>

      )}

    </div>
  );
}
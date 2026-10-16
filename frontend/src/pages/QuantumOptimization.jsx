import { useEffect, useState } from "react";

import {
  Atom,
  RefreshCw,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Truck,
  Calculator
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";


export default function QuantumOptimization() {

  const { user } = useAuth();


  const role =
    String(
      user?.role ||
      user?.role_name ||
      ""
    )
      .trim()
      .toUpperCase();


  const isNationalHead =
    role === "NATIONAL_HEAD";


  const [requests, setRequests] =
    useState([]);

  const [selectedRequestId, setSelectedRequestId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [optimizing, setOptimizing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState(null);


  // =====================================================
  // LOAD REQUESTS
  // =====================================================

  const loadRequests = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await api.get(
          "/resource-requests/all"
        );


      const data =
        response.data;


      const allRequests =
        Array.isArray(data.data)
          ? data.data
          : [];


      // Quantum can only operate on
      // NATIONAL_APPROVED requests.

      const approvedRequests =
        allRequests.filter(
          request =>
            request.request_status ===
            "NATIONAL_APPROVED"
        );


      setRequests(
        approvedRequests
      );


      // Automatically select first
      // eligible request.

      if (
        approvedRequests.length > 0
      ) {

        setSelectedRequestId(
          String(
            approvedRequests[0]
              .resource_request_id
          )
        );

      } else {

        setSelectedRequestId("");

      }

    } catch (err) {

      console.error(
        "Load quantum requests error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load resource requests."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    if (isNationalHead) {

      loadRequests();

    } else {

      setLoading(false);

    }

  }, [isNationalHead]);


  // =====================================================
  // RUN QUANTUM OPTIMIZATION
  // =====================================================

  const runOptimization =
    async () => {

      if (!isNationalHead) {

        setError(
          "Only the National Head can run quantum optimization."
        );

        return;
      }


      if (!selectedRequestId) {

        setError(
          "Please select a NATIONAL_APPROVED resource request."
        );

        return;
      }


      try {

        setOptimizing(true);

        setError("");

        setResult(null);


        const response =
          await api.post(
            `/resource-allocations/${selectedRequestId}/quantum-optimize`
          );


        console.log(
          "Quantum optimization response:",
          response.data
        );


        setResult(
          response.data
        );


        await loadRequests();

      } catch (err) {

        console.error(
          "Quantum optimization error:",
          err
        );


        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Quantum optimization failed.";


        setError(message);

      } finally {

        setOptimizing(false);

      }

    };


  // =====================================================
  // NOT NATIONAL HEAD
  // =====================================================

  if (!isNationalHead) {

    return (

      <div className="space-y-6">

        <div>

          <h1 className="text-2xl font-bold text-gray-900">

            Quantum Optimization

          </h1>

          <p className="mt-1 text-sm text-gray-500">

            QAOA-style multi-warehouse resource allocation.

          </p>

        </div>


        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8">

          <div className="flex items-start gap-4">

            <AlertTriangle
              size={30}
              className="mt-1 text-orange-600"
            />

            <div>

              <h2 className="text-lg font-bold text-orange-900">

                National Head authorization required

              </h2>

              <p className="mt-2 text-sm text-orange-800">

                Quantum optimization is performed only
                after the State Head and National Head
                approval workflow is complete.

              </p>

              <p className="mt-2 text-sm font-semibold text-orange-900">

                Current role: {role || "UNKNOWN"}

              </p>

              <p className="mt-3 text-sm text-orange-700">

                Log in as the National Head to run
                the optimization.

              </p>

            </div>

          </div>

        </div>

      </div>

    );
  }


  // =====================================================
  // NATIONAL HEAD PAGE
  // =====================================================

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-purple-100 p-3">

              <Atom
                size={25}
                className="text-purple-600"
              />

            </div>

            <div>

              <h1 className="text-2xl font-bold text-gray-900">

                Quantum Optimization

              </h1>

              <p className="mt-1 text-sm text-gray-500">

                Optimize disaster resource allocation
                across multiple warehouses.

              </p>

            </div>

          </div>

        </div>


        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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


      {/* ALGORITHM INFO */}

      <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">

        <div className="flex items-start gap-3">

          <Atom
            size={22}
            className="mt-0.5 text-purple-600"
          />

          <div>

            <h2 className="font-bold text-purple-900">

              QAOA-Style Multi-Warehouse Optimization

            </h2>

            <p className="mt-1 text-sm text-purple-800">

              The optimizer considers resource demand,
              warehouse availability, distance,
              shortage and disaster priority.

            </p>

          </div>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <XCircle
              size={21}
              className="text-red-600"
            />

            <div>

              <p className="font-semibold text-red-800">

                Optimization Error

              </p>

              <p className="mt-1 text-sm text-red-700">

                {error}

              </p>

            </div>

          </div>

        </div>

      )}


      {/* LOADING */}

      {loading && (

        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-gray-200 bg-white">

          <div className="text-center">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-gray-400"
            />

            <p className="mt-3 text-sm text-gray-500">

              Loading approved resource requests...

            </p>

          </div>

        </div>

      )}


      {/* NO APPROVED REQUEST */}

      {!loading &&
        requests.length === 0 &&
        !error && (

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

            <Package
              size={45}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 text-lg font-bold text-gray-700">

              No requests ready for optimization

            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">

              A resource request must first receive
              State Head approval and National Head
              approval. It will then appear here with
              status NATIONAL_APPROVED.

            </p>

          </div>

        )}


      {/* REQUEST SELECTION */}

      {!loading &&
        requests.length > 0 && (

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-2">

              <Calculator
                size={20}
                className="text-purple-600"
              />

              <h2 className="text-lg font-bold text-gray-900">

                Select Approved Request

              </h2>

            </div>


            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold text-gray-700">

                Resource Request

              </label>


              <select
                value={selectedRequestId}
                onChange={(e) =>
                  setSelectedRequestId(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >

                {requests.map(
                  (request) => (

                    <option
                      key={
                        request.resource_request_id
                      }
                      value={
                        request.resource_request_id
                      }
                    >

                      Request #
                      {request.resource_request_id}

                      {" — "}

                      {request.disaster_name ||
                        "Disaster"}

                      {" — "}

                      {request.state_name ||
                        "State"}

                      {" — "}

                      {request.priority}

                    </option>

                  )
                )}

              </select>

            </div>


            {/* SELECTED REQUEST */}

            {selectedRequestId && (

              <div className="mt-5 grid gap-4 md:grid-cols-3">

                {(() => {

                  const selected =
                    requests.find(
                      request =>
                        String(
                          request.resource_request_id
                        ) ===
                        String(
                          selectedRequestId
                        )
                    );

                  if (!selected) {
                    return null;
                  }


                  return (

                    <>

                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs font-semibold uppercase text-gray-400">

                          Request

                        </p>

                        <p className="mt-1 text-lg font-bold text-gray-900">

                          #{selected.resource_request_id}

                        </p>

                      </div>


                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs font-semibold uppercase text-gray-400">

                          State

                        </p>

                        <p className="mt-1 font-bold text-gray-900">

                          {selected.state_name}

                        </p>

                      </div>


                      <div className="rounded-xl bg-gray-50 p-4">

                        <p className="text-xs font-semibold uppercase text-gray-400">

                          Status

                        </p>

                        <div className="mt-2">

                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">

                            NATIONAL APPROVED

                          </span>

                        </div>

                      </div>

                    </>

                  );

                })()}

              </div>

            )}


            {/* RUN BUTTON */}

            <div className="mt-6 flex justify-end">

              <button
                onClick={
                  runOptimization
                }
                disabled={
                  optimizing ||
                  !selectedRequestId
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {optimizing ? (

                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />

                    Running Quantum Optimization...

                  </>

                ) : (

                  <>
                    <Play size={18} />

                    Run Quantum Optimization

                  </>

                )}

              </button>

            </div>

          </div>

        )}


      {/* RESULT */}

      {result && (

        <div className="space-y-5">

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

            <div className="flex items-start gap-3">

              <CheckCircle
                size={24}
                className="text-green-600"
              />

              <div>

                <h2 className="font-bold text-green-900">

                  Optimization Completed

                </h2>

                <p className="mt-1 text-sm text-green-800">

                  Quantum resource optimization completed successfully.

                </p>

              </div>

            </div>

          </div>


          {/* SUMMARY */}

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-xs font-semibold uppercase text-gray-400">

                Total Required

              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">

                {Number(
                  result.totalRequired || 0
                ).toLocaleString()}

              </p>

            </div>


            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-xs font-semibold uppercase text-gray-400">

                Total Allocated

              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">

                {Number(
                  result.totalAllocated || 0
                ).toLocaleString()}

              </p>

            </div>


            <div className="rounded-xl border border-gray-200 bg-white p-5">

              <p className="text-xs font-semibold uppercase text-gray-400">

                Total Shortage

              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">

                {Number(
                  result.totalShortage || 0
                ).toLocaleString()}

              </p>

            </div>

          </div>


          {/* RESOURCES */}

          {Array.isArray(
            result.resources
          ) && (

            <div className="space-y-4">

              {result.resources.map(
                (resource) => (

                  <div
                    key={
                      resource.resource_id
                    }
                    className="rounded-2xl border border-gray-200 bg-white p-5"
                  >

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                      <div>

                        <h3 className="text-lg font-bold text-gray-900">

                          {resource.resource_name}

                        </h3>

                        <p className="text-sm text-gray-500">

                          Required:
                          {" "}
                          {Number(
                            resource.required_quantity ||
                            0
                          ).toLocaleString()}

                        </p>

                      </div>


                      <div className="flex gap-2">

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">

                          Allocated:
                          {" "}
                          {Number(
                            resource.total_allocated ||
                            0
                          ).toLocaleString()}

                        </span>

                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">

                          Shortage:
                          {" "}
                          {Number(
                            resource.shortage ||
                            0
                          ).toLocaleString()}

                        </span>

                      </div>

                    </div>


                    {/* ALLOCATIONS */}

                    {Array.isArray(
                      resource.allocations
                    ) &&
                      resource.allocations.length >
                        0 && (

                        <div className="mt-5 overflow-x-auto">

                          <table className="w-full text-left text-sm">

                            <thead>

                              <tr className="border-b border-gray-200 text-xs uppercase text-gray-400">

                                <th className="pb-3">

                                  Warehouse

                                </th>

                                <th className="pb-3">

                                  Quantity

                                </th>

                                <th className="pb-3">

                                  Distance

                                </th>

                                <th className="pb-3">

                                  Cost

                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {resource.allocations.map(
                                (
                                  allocation,
                                  index
                                ) => (

                                  <tr
                                    key={index}
                                    className="border-b border-gray-100 last:border-0"
                                  >

                                    <td className="py-3 font-semibold text-gray-800">

                                      <div className="flex items-center gap-2">

                                        <Truck
                                          size={16}
                                          className="text-purple-500"
                                        />

                                        {
                                          allocation.warehouse_name
                                        }

                                      </div>

                                    </td>


                                    <td className="py-3 font-semibold">

                                      {Number(
                                        allocation.quantity_allocated ||
                                        0
                                      ).toLocaleString()}

                                    </td>


                                    <td className="py-3 text-gray-500">

                                      <div className="flex items-center gap-1">

                                        <MapPin size={14} />

                                        {Number(
                                          allocation.distance_km ||
                                          0
                                        ).toFixed(2)}
                                        {" km"}

                                      </div>

                                    </td>


                                    <td className="py-3 font-semibold">

                                      {Number(
                                        allocation.cost ||
                                        0
                                      ).toFixed(3)}

                                    </td>

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                      )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}

    </div>
  );
}
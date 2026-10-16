import { useEffect, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Users,
  Activity,
  Clock,
  X,
  ShieldAlert,
  Package,
  Warehouse,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

/* =========================================================
   SEVERITY STYLING
========================================================= */

function getSeverityClass(severity) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700 border-red-200";

    case "HIGH":
      return "bg-orange-100 text-orange-700 border-orange-200";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";

    case "LOW":
      return "bg-green-100 text-green-700 border-green-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* =========================================================
   PREDICTION CARD
========================================================= */

function PredictionCard({ prediction, onClick }) {
  const probability = Number(prediction.probability || 0);

  /*
    Probability is stored as:
    0.93 → 93%

    Confidence can be stored as:
    0.91 → 91%
    OR
    91 → 91%

    This handles both cases.
  */
  const rawConfidence = Number(
    prediction.confidence_score || 0
  );

  const confidence =
    rawConfidence <= 1
      ? rawConfidence * 100
      : rawConfidence;

  return (
    <div
      onClick={() => onClick(prediction)}
      className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={20}
              className="text-orange-500"
            />

            <h3 className="text-lg font-bold text-gray-900">
              {prediction.disaster_name}
            </h3>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={15} />

            {prediction.state_name || "Unknown State"}
          </div>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
            prediction.severity
          )}`}
        >
          {prediction.severity}
        </span>
      </div>

      {/* Probability / Confidence */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Probability
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {(probability * 100).toFixed(0)}%
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            Confidence
          </p>

          <p className="mt-1 text-xl font-bold text-gray-900">
            {confidence.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Population / Area */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />

          {Number(
            prediction.affected_population || 0
          ).toLocaleString()}{" "}
          people
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity size={16} />

          {Number(
            prediction.affected_area_km2 || 0
          ).toLocaleString()}{" "}
          km²
        </div>
      </div>

      {/* Expected date */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <Clock size={14} />

        Expected:{" "}
        {formatDate(prediction.expected_start_time)}
      </div>
    </div>
  );
}

/* =========================================================
   RESOURCE REQUIREMENT COMPONENT
========================================================= */

function ResourceRequirements({
  requirements,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Package
            size={20}
            className="text-blue-600"
          />

          <h3 className="font-semibold text-gray-900">
            Resource Requirements
          </h3>
        </div>

        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <span className="ml-3 text-sm text-gray-500">
            Calculating resource requirements...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />

          <h3 className="font-semibold">
            Resource Requirement Error
          </h3>
        </div>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!requirements || requirements.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2">
          <Package
            size={20}
            className="text-gray-500"
          />

          <h3 className="font-semibold text-gray-900">
            Resource Requirements
          </h3>
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            No resource requirement rules are configured
            for this prediction.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <Package
            size={20}
            className="text-blue-600"
          />

          <h3 className="font-semibold text-gray-900">
            Resource Requirements
          </h3>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Required resources calculated from the predicted
          affected population and disaster severity.
        </p>
      </div>

      {/* Resource Cards */}
      <div className="mt-5 space-y-4">
        {requirements.map((resource) => {
          const required = Number(
            resource.quantity_required || 0
          );

          const available = Number(
            resource.quantity_available || 0
          );

          const shortage = Number(
            resource.quantity_shortage || 0
          );

          const coverage =
            required > 0
              ? Math.min(
                  (available / required) * 100,
                  100
                )
              : 100;

          return (
            <div
              key={resource.resource_id}
              className="rounded-xl border border-gray-200 p-4"
            >
              {/* Resource header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {resource.resource_name}
                  </h4>

                  <p className="mt-1 text-xs text-gray-500">
                    Unit: {resource.unit}
                  </p>
                </div>

                {shortage > 0 ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    Shortage
                  </span>
                ) : (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Sufficient
                  </span>
                )}
              </div>

              {/* Numbers */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Required
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {required.toLocaleString()}{" "}
                    {resource.unit}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Available
                  </p>

                  <p className="mt-1 font-bold text-blue-600">
                    {available.toLocaleString()}{" "}
                    {resource.unit}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Shortage
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      shortage > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {shortage.toLocaleString()}{" "}
                    {resource.unit}
                  </p>
                </div>
              </div>

              {/* Coverage */}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>
                    Inventory Coverage
                  </span>

                  <span>
                    {coverage.toFixed(0)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${
                      shortage > 0
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${coverage}%`,
                    }}
                  />
                </div>
              </div>

              {/* Warehouse inventory */}
              {resource.inventory &&
                resource.inventory.length > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Warehouse
                        size={16}
                        className="text-gray-500"
                      />

                      <p className="text-sm font-semibold text-gray-700">
                        Warehouse Inventory
                      </p>
                    </div>

                    <div className="space-y-2">
                      {resource.inventory.map(
                        (warehouse) => (
                          <div
                            key={
                              warehouse.warehouse_id
                            }
                            className="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {
                                  warehouse.warehouse_name
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  warehouse.state_name
                                }
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-sm font-semibold text-gray-800">
                                Usable:{" "}
                                {Number(
                                  warehouse.usable_quantity ||
                                    0
                                ).toLocaleString()}{" "}
                                {resource.unit}
                              </p>

                              <p className="text-xs text-gray-500">
                                Available:{" "}
                                {Number(
                                  warehouse.quantity_available ||
                                    0
                                ).toLocaleString()}{" "}
                                | Reserved:{" "}
                                {Number(
                                  warehouse.quantity_reserved ||
                                    0
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Shortage summary */}
      {requirements.some(
        (resource) =>
          Number(resource.quantity_shortage || 0) > 0
      ) && (
        <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 text-orange-600"
            />

            <div>
              <p className="font-semibold text-orange-800">
                Resource shortage detected
              </p>

              <p className="mt-1 text-sm text-orange-700">
                One or more required resources are
                currently unavailable in sufficient
                quantities. A resource request can be
                created for further approval and
                allocation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PREDICTION MODAL
========================================================= */

function PredictionModal({
  prediction,
  resourceRequirements,
  requirementsLoading,
  requirementsError,
  onClose,
  onCreateRequest,
}) {
  if (!prediction) return null;

  const probability = Number(
    prediction.probability || 0
  );

  const rawConfidence = Number(
    prediction.confidence_score || 0
  );

  const confidence =
    rawConfidence <= 1
      ? rawConfidence * 100
      : rawConfidence;

  const hasShortage =
    resourceRequirements &&
    resourceRequirements.some(
      (resource) =>
        Number(resource.quantity_shortage || 0) > 0
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-red-500" />

              <h2 className="text-2xl font-bold text-gray-900">
                {prediction.disaster_name}
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Prediction #{prediction.prediction_id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6 p-6">
          {/* Severity */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              Severity
            </span>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold ${getSeverityClass(
                prediction.severity
              )}`}
            >
              {prediction.severity}
            </span>
          </div>

          {/* Main Statistics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Probability
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {(probability * 100).toFixed(1)}%
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Affected Population
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {Number(
                  prediction.affected_population || 0
                ).toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Affected Area
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {Number(
                  prediction.affected_area_km2 || 0
                ).toLocaleString()}{" "}
                km²
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">
              Predicted Location
            </h3>

            <div className="mt-3 flex items-center gap-2 text-gray-600">
              <MapPin size={18} />

              <span>
                {prediction.state_name ||
                  "Unknown State"}
              </span>
            </div>

            {prediction.district_name && (
              <p className="mt-2 text-sm text-gray-500">
                District: {prediction.district_name}
              </p>
            )}
          </div>

          {/* Timing */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">
              Expected Timeline
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">
                  Expected Start
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {formatDate(
                    prediction.expected_start_time
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Expected End
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {formatDate(
                    prediction.expected_end_time
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Model Confidence */}
          <div className="rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between">
              <h3 className="font-semibold text-gray-900">
                Model Confidence
              </h3>

              <span className="font-bold text-gray-900">
                {confidence.toFixed(0)}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${Math.min(
                    Math.max(confidence, 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Resource Requirements */}
          <ResourceRequirements
            requirements={resourceRequirements}
            loading={requirementsLoading}
            error={requirementsError}
          />

          {/* Create Request */}
          {!requirementsLoading &&
            !requirementsError &&
            hasShortage && (
              <button
                onClick={() =>
                  onCreateRequest(
                    prediction,
                    resourceRequirements
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Package size={19} />

                Create Resource Request
              </button>
            )}

          {/* Prediction Details */}
          {prediction.prediction_details && (
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                Prediction Details
              </h3>

              <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
                {typeof prediction.prediction_details ===
                "string"
                  ? prediction.prediction_details
                  : JSON.stringify(
                      prediction.prediction_details,
                      null,
                      2
                    )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PREDICTIONS PAGE
========================================================= */

export default function Predictions() {
  const [predictions, setPredictions] =
    useState([]);

  
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedPrediction, setSelectedPrediction] =
    useState(null);

  const [resourceRequirements, setResourceRequirements] =
    useState([]);

  const [requirementsLoading, setRequirementsLoading] =
    useState(false);

  const [requirementsError, setRequirementsError] =
    useState("");

  /* =======================================================
     LOAD PREDICTIONS
  ======================================================= */

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/disasters/predictions"
      );

      console.log(
        "FULL PREDICTIONS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      const responseData = response.data;

      const predictionData =
        Array.isArray(responseData.data)
          ? responseData.data
          : Array.isArray(
              responseData.data?.predictions
            )
          ? responseData.data.predictions
          : Array.isArray(
              responseData.predictions
            )
          ? responseData.predictions
          : [];

      console.log(
        "EXTRACTED PREDICTIONS:",
        predictionData
      );

      setPredictions(predictionData);
    } catch (err) {
      console.error(
        "Prediction loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load disaster predictions"
      );
    } finally {
      setLoading(false);
    }
  };

  
/* =======================================================
   LOAD SAVED PREDICTION HISTORY
======================================================= */

const loadPredictionHistory = async () => {
  try {
    setHistoryLoading(true);
    setHistoryError("");

    const response = await api.get(
      "/prediction-history?limit=50"
    );

    setPredictionHistory(
      Array.isArray(response.data?.predictions)
        ? response.data.predictions
        : []
    );
  } catch (err) {
    console.error("Prediction history error:", err);

    setHistoryError(
      err.response?.data?.message ||
      "Unable to load prediction history."
    );
  } finally {
    setHistoryLoading(false);
  }
};


  /* =======================================================
     LOAD RESOURCE REQUIREMENTS
  ======================================================= */

  const loadResourceRequirements = async (
    predictionId
  ) => {
    try {
      setRequirementsLoading(true);
      setRequirementsError("");
      setResourceRequirements([]);

      console.log(
        "Loading resource requirements for prediction:",
        predictionId
      );

      const response = await api.get(
        `/resource-requirements/prediction/${predictionId}`
      );

      console.log(
        "RESOURCE REQUIREMENTS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      setResourceRequirements(
        response.data?.data?.requirements || []
      );
    } catch (err) {
      console.error(
        "Resource requirement loading error:",
        err
      );

      setRequirementsError(
        err.response?.data?.message ||
          "Unable to calculate resource requirements"
      );
    } finally {
      setRequirementsLoading(false);
    }
  };

  /* =======================================================
     HANDLE PREDICTION CLICK
  ======================================================= */

  const handlePredictionClick = (
    prediction
  ) => {
    setSelectedPrediction(prediction);

    loadResourceRequirements(
      prediction.prediction_id
    );
  };

  /* =======================================================
     CREATE RESOURCE REQUEST
     
     TEMPORARY:
     We are only testing the button here.
     The actual POST request will be implemented
     in the next step.
  ======================================================= */
const handleCreateRequest = async (prediction, requirements) => {
  try {
    if (!requirements) {
      alert("Resource requirements are not loaded yet.");
      return;
    }

    const predictionData = requirements.prediction || {};

    const predictionId =
      prediction.prediction_id || predictionData.prediction_id;

    const stateId =
      prediction.state_id || predictionData.state_id;

    if (!predictionId) {
      alert("Prediction ID is missing.");
      return;
    }

    if (!stateId) {
      alert("State ID is missing.");
      return;
    }

    const priorityMap = {
      LOW: "LOW",
      MEDIUM: "MEDIUM",
      HIGH: "HIGH",
      CRITICAL: "CRITICAL"
    };

    const priority =
      priorityMap[prediction.severity] || "MEDIUM";

    const disasterName =
      prediction.disaster_name ||
      predictionData.disaster_name ||
      "Disaster";

    const stateName =
      prediction.state_name ||
      predictionData.state_name ||
      "affected state";

    const payload = {
      predictionId,
      stateId,
      priority,
      reason: `Resource shortage for predicted ${disasterName} in ${stateName}`
    };

    console.log("=================================");
    console.log("CREATING RESOURCE REQUEST");
    console.log("=================================");
    console.log(payload);

    const response = await api.post(
      "/resource-requests/from-shortage",
      payload
    );

    console.log("Resource request response:");
    console.log(response.data);

    if (response.data.success) {
      const requestId =
        response.data.data?.resourceRequest?.resourceRequestId;

      alert(
        requestId
          ? `Resource Request #${requestId} created successfully.\n\nStatus: PENDING_STATE_APPROVAL`
          : response.data.message
      );

      // Refresh requirements after creating the request
      await loadResourceRequirements(predictionId);

    } else {
      alert(
        response.data.message ||
        "Unable to create resource request."
      );
    }

  } catch (error) {
    console.error("=================================");
    console.error("CREATE RESOURCE REQUEST ERROR");
    console.error("=================================");
    console.error(error);

    const message =
      error.response?.data?.message ||
      "Failed to create resource request.";

    alert(message);
  }
};

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadPredictions();
    loadPredictionHistory();
  }, []);

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-gray-500">
            Loading predictions...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Disaster Predictions
        </h1>

        <p className="mt-1 text-gray-500">
          Monitor AI-generated disaster predictions
          across the country.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Total */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Predictions
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {predictions.length}
          </p>
        </div>

        {/* Critical */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Critical
          </p>

          <p className="mt-2 text-3xl font-bold text-red-600">
            {
              predictions.filter(
                (p) =>
                  p.severity === "CRITICAL"
              ).length
            }
          </p>
        </div>

        {/* High */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            High Risk
          </p>

          <p className="mt-2 text-3xl font-bold text-orange-600">
            {
              predictions.filter(
                (p) =>
                  p.severity === "HIGH"
              ).length
            }
          </p>
        </div>

        {/* Population */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Population at Risk
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {predictions
              .reduce(
                (total, prediction) =>
                  total +
                  Number(
                    prediction.affected_population ||
                      0
                  ),
                0
              )
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* Prediction Cards */}
      {predictions.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle
            size={40}
            className="mx-auto text-gray-400"
          />

          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            No predictions available
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            No disaster predictions have been
            generated yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {predictions.map((prediction) => (
            <PredictionCard
              key={prediction.prediction_id}
              prediction={prediction}
              onClick={handlePredictionClick}
            />
          ))}
        </div>
      )}

      
{/* =======================================================
    SAVED PREDICTION HISTORY
======================================================= */}

<section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Prediction History
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Previous model results saved in the database.
      </p>
    </div>

    <button
      onClick={loadPredictionHistory}
      disabled={historyLoading}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {historyLoading ? "Loading..." : "Refresh History"}
    </button>
  </div>

  {historyError && (
    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {historyError}
    </div>
  )}

  {historyLoading ? (
    <p className="py-8 text-center text-sm text-gray-500">
      Loading prediction history...
    </p>
  ) : predictionHistory.length === 0 ? (
    <p className="py-8 text-center text-sm text-gray-500">
      No saved prediction runs found.
    </p>
  ) : (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="px-3 py-3 font-medium">Run ID</th>
            <th className="px-3 py-3 font-medium">State</th>
            <th className="px-3 py-3 font-medium">Prediction</th>
            <th className="px-3 py-3 font-medium">Probability</th>
            <th className="px-3 py-3 font-medium">Severity</th>
            <th className="px-3 py-3 font-medium">Date</th>
          </tr>
        </thead>

        <tbody>
          {predictionHistory.map((run) => (
            <tr
              key={run.run_id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td className="px-3 py-4 font-medium text-gray-700">
                #{run.run_id}
              </td>

              <td className="px-3 py-4 text-gray-700">
                {run.state_name}
              </td>

              <td className="px-3 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    run.predicted_class === "NORMAL"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {run.predicted_class}
                </span>
              </td>

              <td className="px-3 py-4 font-semibold text-gray-800">
                {Number(run.probability_percent).toFixed(2)}%
              </td>

              <td className="px-3 py-4">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
                    run.severity
                  )}`}
                >
                  {run.severity}
                </span>
              </td>

              <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                {formatDate(run.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>


      {/* Prediction Detail Modal */}
      <PredictionModal
        prediction={selectedPrediction}
        resourceRequirements={
          resourceRequirements
        }
        requirementsLoading={
          requirementsLoading
        }
        requirementsError={
          requirementsError
        }
        onClose={() =>
          setSelectedPrediction(null)
        }
        onCreateRequest={
          handleCreateRequest
        }
      />
    </div>
  );
}
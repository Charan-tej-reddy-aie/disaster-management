import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import api from "../services/api";

export default function CreateResourceRequest() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    predictionId: "",
    stateId: "1",
    priority: "CRITICAL",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(null);

    if (!form.predictionId) {
      setError("Please enter a prediction ID.");
      return;
    }

    if (!form.stateId) {
      setError("Please enter a state ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/resource-requests/from-shortage",
        {
          predictionId: Number(form.predictionId),
          stateId: Number(form.stateId),
          priority: form.priority,
          reason: form.reason,
        }
      );

      console.log("Created resource request:", response.data);

      setSuccess(response.data);

      setTimeout(() => {
        navigate("/resource-requests");
      }, 1500);
    } catch (err) {
      console.error("Create request error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create resource request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/resource-requests")}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Create Resource Request
          </h1>

          <p className="text-sm text-slate-500">
            Create an emergency resource request from a disaster prediction
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <div>
              <h2 className="font-semibold text-blue-900">
                Request From Prediction
              </h2>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                The system will use the selected prediction's calculated
                resource shortages to create the request automatically.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Prediction ID */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Prediction ID
            </label>

            <input
              type="number"
              min="1"
              name="predictionId"
              value={form.predictionId}
              onChange={handleChange}
              placeholder="Example: 4"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              The prediction must have calculated resource requirements.
            </p>
          </div>

          {/* State */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              State ID
            </label>

            <input
              type="number"
              min="1"
              name="stateId"
              value={form.stateId}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              Kerala = 1, Tamil Nadu = 2, Karnataka = 3.
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reason
            </label>

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={4}
              placeholder="Enter the reason for requesting emergency resources..."
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle size={18} />

              <div>
                <p className="font-semibold">
                  Resource request created successfully.
                </p>

                <p className="mt-1">
                  Request ID: #
                  {success.requestId ||
                    success.resourceRequestId ||
                    success.request?.resource_request_id ||
                    "created"}
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => navigate("/resource-requests")}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />

              {loading ? "Creating..." : "Create Resource Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
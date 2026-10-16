import {
  TriangleAlert,
  MapPin,
  Clock,
} from "lucide-react";

export default function DisasterAlert({ prediction }) {
  const severityClass = {
    LOW: "bg-green-100 text-green-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-orange-100 text-orange-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="flex gap-3">

          <div className="rounded-lg bg-red-100 p-2 text-red-600">
            <TriangleAlert size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-slate-800">
              {prediction.disaster_name}
            </h3>

            <p className="text-xs text-slate-500">
              {prediction.state_name}
            </p>
          </div>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            severityClass[prediction.severity] ||
            "bg-slate-100 text-slate-600"
          }`}
        >
          {prediction.severity}
        </span>

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={15} />
          {Number(prediction.affected_area_km2 || 0).toFixed(0)} km²
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={15} />
          {(Number(prediction.probability || 0) * 100).toFixed(0)}% probability
        </div>

      </div>

    </div>
  );
}
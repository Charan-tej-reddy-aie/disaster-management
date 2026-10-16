import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function getSeverityColor(severity) {
  switch (severity) {
    case "CRITICAL":
      return "#dc2626";

    case "HIGH":
      return "#f97316";

    case "MEDIUM":
      return "#eab308";

    case "LOW":
      return "#22c55e";

    default:
      return "#64748b";
  }
}

export default function DisasterMap({
  states = [],
  predictions = [],
  warehouses = [],
}) {
  const defaultCenter = [12.9716, 78.6569];

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-b-xl">

      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* States */}
        {states.map((state) => (
          <CircleMarker
            key={`state-${state.state_id}`}
            center={[
              Number(state.latitude),
              Number(state.longitude),
            ]}
            radius={8}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.7,
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-bold">
                  {state.state_name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  State monitoring location
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Predictions */}
        {predictions.map((prediction) => {
          if (
            !prediction.state_latitude ||
            !prediction.state_longitude
          ) {
            return null;
          }

          const color = getSeverityColor(
            prediction.severity
          );

          return (
            <CircleMarker
              key={`prediction-${prediction.prediction_id}`}
              center={[
                Number(prediction.state_latitude),
                Number(prediction.state_longitude),
              ]}
              radius={
                prediction.severity === "CRITICAL"
                  ? 24
                  : prediction.severity === "HIGH"
                    ? 19
                    : 14
              }
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 3,
              }}
            >
              <Popup>
                <div className="min-w-[210px]">

                  <h3 className="text-base font-bold">
                    {prediction.disaster_name}
                  </h3>

                  <p className="mt-1 text-sm">
                    {prediction.state_name}
                  </p>

                  <div className="mt-3 space-y-1 text-xs">

                    <p>
                      <strong>Severity:</strong>{" "}
                      {prediction.severity}
                    </p>

                    <p>
                      <strong>Probability:</strong>{" "}
                      {(
                        Number(prediction.probability) * 100
                      ).toFixed(0)}
                      %
                    </p>

                    <p>
                      <strong>Affected Area:</strong>{" "}
                      {Number(
                        prediction.affected_area_km2 || 0
                      ).toFixed(0)}
                      {" "}km²
                    </p>

                    <p>
                      <strong>Population:</strong>{" "}
                      {Number(
                        prediction.affected_population || 0
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Warehouses */}
        {warehouses.map((warehouse) => (
          <Marker
            key={`warehouse-${warehouse.warehouse_id}`}
            position={[
              Number(warehouse.latitude),
              Number(warehouse.longitude),
            ]}
          >
            <Popup>
              <div className="min-w-[220px]">

                <h3 className="font-bold">
                  {warehouse.warehouse_name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {warehouse.state_name}
                </p>

                <div className="mt-3">
                  <p className="text-xs text-slate-600">
                    Usable inventory
                  </p>

                  <p className="text-lg font-bold text-green-600">
                    {Number(
                      warehouse.total_usable_inventory || 0
                    ).toLocaleString()}
                  </p>
                </div>

              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

    </div>
  );
}
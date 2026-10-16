import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Warehouse,
  RefreshCw,
  Boxes,
  AlertTriangle
} from "lucide-react";

import api from "../services/api";

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadResources = async () => {
    try {
      setLoading(true);

      const response = await api.get("/resources/all");

      setResources(response.data.data || []);

    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    const value = search.toLowerCase();

    return resources.filter((item) =>
      [
        item.resource_name,
        item.category_name,
        item.warehouse_name,
        item.state_name
      ]
        .filter(Boolean)
        .some((text) =>
          String(text).toLowerCase().includes(value)
        )
    );
  }, [resources, search]);

  const totalAvailable = resources.reduce(
    (sum, item) => sum + Number(item.quantity_available || 0),
    0
  );

  const totalReserved = resources.reduce(
    (sum, item) => sum + Number(item.quantity_reserved || 0),
    0
  );

  const warehouseCount = new Set(
    resources
      .map((item) => item.warehouse_id)
      .filter(Boolean)
  ).size;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Resources
          </h1>

          <p className="text-gray-500 mt-1">
            Monitor disaster-response resources across warehouses
          </p>
        </div>

        <button
          onClick={loadResources}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Package className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Resource Records
              </p>

              <p className="text-2xl font-bold">
                {resources.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <Boxes className="text-green-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Available Quantity
              </p>

              <p className="text-2xl font-bold">
                {totalAvailable.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100">
              <Warehouse className="text-orange-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Warehouses
              </p>

              <p className="text-2xl font-bold">
                {warehouseCount}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-xl border shadow-sm p-4">

        <input
          type="text"
          placeholder="Search resource, category, warehouse or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            Resource Inventory
          </h2>
        </div>

        {loading ? (

          <div className="p-10 text-center text-gray-500">
            Loading resources...
          </div>

        ) : filteredResources.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No resources found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>
                  <th className="text-left px-5 py-3 text-sm font-semibold">
                    Resource
                  </th>

                  <th className="text-left px-5 py-3 text-sm font-semibold">
                    Category
                  </th>

                  <th className="text-left px-5 py-3 text-sm font-semibold">
                    Warehouse
                  </th>

                  <th className="text-left px-5 py-3 text-sm font-semibold">
                    State
                  </th>

                  <th className="text-right px-5 py-3 text-sm font-semibold">
                    Available
                  </th>

                  <th className="text-right px-5 py-3 text-sm font-semibold">
                    Reserved
                  </th>

                  <th className="text-left px-5 py-3 text-sm font-semibold">
                    Unit
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y">

                {filteredResources.map((item) => (

                  <tr
                    key={item.warehouse_resource_id || `${item.resource_id}-${item.warehouse_id}`}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {item.resource_name}
                      </div>

                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.category_name}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Warehouse size={16} />
                        {item.warehouse_name || "Not assigned"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.state_name || "-"}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold">
                      {Number(
                        item.quantity_available || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {Number(
                        item.quantity_reserved || 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.unit}
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

export default Resources;
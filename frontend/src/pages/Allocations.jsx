import { useEffect, useMemo, useState } from "react";
import {
    PackageCheck,
    Search,
    RefreshCw,
    Warehouse,
    Truck,
    MapPin,
    GitBranch
} from "lucide-react";

import api from "../services/api";

export default function Allocations() {
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadAllocations = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/allocations/all");

            setAllocations(response.data.data || []);
        } catch (err) {
            console.error("Failed to load allocations:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load allocations"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllocations();
    }, []);

    const filteredAllocations = useMemo(() => {
        return allocations.filter((item) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                String(item.allocation_id).includes(searchText) ||
                String(item.resource_request_id).includes(searchText) ||
                item.resource_name?.toLowerCase().includes(searchText) ||
                item.warehouse_name?.toLowerCase().includes(searchText) ||
                item.state_name?.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "ALL" ||
                item.allocation_status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allocations, search, statusFilter]);

    const statistics = useMemo(() => {
        const allocationIds = new Set(
            allocations.map((item) => item.allocation_id)
        );

        const planned = new Set(
            allocations
                .filter((x) => x.allocation_status === "PLANNED")
                .map((x) => x.allocation_id)
        );

        const approved = new Set(
            allocations
                .filter((x) => x.allocation_status === "APPROVED")
                .map((x) => x.allocation_id)
        );

        const delivered = new Set(
            allocations
                .filter((x) => x.allocation_status === "DELIVERED")
                .map((x) => x.allocation_id)
        );

        return {
            total: allocationIds.size,
            planned: planned.size,
            approved: approved.size,
            delivered: delivered.size
        };
    }, [allocations]);

    const statusClass = (status) => {
        switch (status) {
            case "PLANNED":
                return "bg-yellow-100 text-yellow-800";

            case "APPROVED":
                return "bg-blue-100 text-blue-800";

            case "DISPATCHED":
                return "bg-purple-100 text-purple-800";

            case "IN_TRANSIT":
                return "bg-orange-100 text-orange-800";

            case "DELIVERED":
                return "bg-green-100 text-green-800";

            case "CANCELLED":
                return "bg-red-100 text-red-800";

            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Resource Allocations
                    </h1>

                    <p className="text-gray-500 mt-1">
                        View and track resources allocated to disaster response requests.
                    </p>
                </div>

                <button
                    onClick={loadAllocations}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>

            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Total Allocations
                            </p>

                            <p className="text-2xl font-bold mt-1">
                                {statistics.total}
                            </p>
                        </div>

                        <PackageCheck className="text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Planned
                            </p>

                            <p className="text-2xl font-bold mt-1">
                                {statistics.planned}
                            </p>
                        </div>

                        <GitBranch className="text-yellow-600" />
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Approved
                            </p>

                            <p className="text-2xl font-bold mt-1">
                                {statistics.approved}
                            </p>
                        </div>

                        <PackageCheck className="text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Delivered
                            </p>

                            <p className="text-2xl font-bold mt-1">
                                {statistics.delivered}
                            </p>
                        </div>

                        <Truck className="text-green-600" />
                    </div>
                </div>

            </div>

            {/* Filters */}
            <div className="bg-white border rounded-xl p-4">

                <div className="flex flex-col md:flex-row gap-3">

                    <div className="relative flex-1">

                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                            type="text"
                            placeholder="Search allocation, resource, warehouse or state..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PLANNED">Planned</option>
                        <option value="APPROVED">Approved</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                </div>

            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="bg-white border rounded-xl p-10 text-center">
                    <RefreshCw
                        className="animate-spin mx-auto text-blue-600"
                        size={28}
                    />

                    <p className="mt-3 text-gray-500">
                        Loading allocations...
                    </p>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredAllocations.length === 0 && (
                <div className="bg-white border rounded-xl p-10 text-center">

                    <PackageCheck
                        size={42}
                        className="mx-auto text-gray-300"
                    />

                    <h3 className="mt-3 font-semibold text-gray-700">
                        No allocations found
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        Allocations will appear here after a resource request
                        is approved and allocated.
                    </p>

                </div>
            )}

            {/* Allocation cards */}
            {!loading && filteredAllocations.length > 0 && (

                <div className="space-y-4">

                    {filteredAllocations.map((item) => (

                        <div
                            key={`${item.allocation_id}-${item.resource_id}-${item.warehouse_id}`}
                            className="bg-white border rounded-xl p-5 hover:shadow-sm transition"
                        >

                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                                <div className="flex items-start gap-4">

                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <PackageCheck
                                            size={24}
                                            className="text-blue-600"
                                        />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h2 className="font-semibold text-gray-900">
                                                Allocation #{item.allocation_id}
                                            </h2>

                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(
                                                    item.allocation_status
                                                )}`}
                                            >
                                                {item.allocation_status}
                                            </span>

                                        </div>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Request #{item.resource_request_id}
                                        </p>

                                    </div>

                                </div>

                                <div className="text-sm text-gray-500">
                                    {item.created_at
                                        ? new Date(item.created_at).toLocaleString()
                                        : "-"}
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">

                                <div className="border rounded-lg p-3">

                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <PackageCheck size={16} />
                                        Resource
                                    </div>

                                    <p className="font-semibold mt-1">
                                        {item.resource_name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {Number(item.quantity_allocated).toLocaleString()}{" "}
                                        {item.unit}
                                    </p>

                                </div>

                                <div className="border rounded-lg p-3">

                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Warehouse size={16} />
                                        Source Warehouse
                                    </div>

                                    <p className="font-semibold mt-1">
                                        {item.warehouse_name}
                                    </p>

                                </div>

                                <div className="border rounded-lg p-3">

                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <MapPin size={16} />
                                        Destination
                                    </div>

                                    <p className="font-semibold mt-1">
                                        {item.state_name}
                                    </p>

                                </div>

                                <div className="border rounded-lg p-3">

                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Truck size={16} />
                                        Movement
                                    </div>

                                    <p className="font-semibold mt-1">
                                        {item.movement_status || "Not created"}
                                    </p>

                                    {item.tracking_reference && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {item.tracking_reference}
                                        </p>
                                    )}

                                </div>

                            </div>

                            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t text-sm">

                                <span>
                                    <strong>Optimization:</strong>{" "}
                                    {item.optimization_run_id
                                        ? `Run #${item.optimization_run_id}`
                                        : "Manual"}
                                </span>

                                <span>
                                    <strong>Priority:</strong>{" "}
                                    {item.priority || "-"}
                                </span>

                                {item.dispatched_at && (
                                    <span>
                                        <strong>Dispatched:</strong>{" "}
                                        {new Date(
                                            item.dispatched_at
                                        ).toLocaleString()}
                                    </span>
                                )}

                                {item.delivered_at && (
                                    <span>
                                        <strong>Delivered:</strong>{" "}
                                        {new Date(
                                            item.delivered_at
                                        ).toLocaleString()}
                                    </span>
                                )}

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}
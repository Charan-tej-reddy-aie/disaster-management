const pool = require("../config/database");

async function getAllAllocations() {
    const [rows] = await pool.query(`
        SELECT
            ra.allocation_id,
            ra.resource_request_id,
            ra.optimization_run_id,
            ra.allocated_by,
            ra.allocation_status,
            ra.created_at,

            rr.request_status,
            rr.priority,
            rr.state_id,

            s.state_name,

            r.resource_id,
            r.resource_name,
            r.unit,

            rai.quantity_allocated,

            w.warehouse_id,
            w.warehouse_name,

            rm.movement_id,
            rm.movement_status,
            rm.tracking_reference,
            rm.dispatched_at,
            rm.delivered_at

        FROM resource_allocations ra

        JOIN resource_requests rr
            ON rr.resource_request_id = ra.resource_request_id

        JOIN states s
            ON s.state_id = rr.state_id

        JOIN resource_allocation_items rai
            ON rai.allocation_id = ra.allocation_id

        JOIN resources r
            ON r.resource_id = rai.resource_id

        JOIN warehouses w
            ON w.warehouse_id = rai.warehouse_id

        LEFT JOIN resource_movements rm
            ON rm.allocation_id = ra.allocation_id
            AND rm.resource_id = rai.resource_id
            AND rm.from_warehouse_id = rai.warehouse_id

        ORDER BY ra.created_at DESC, ra.allocation_id DESC
    `);

    return rows;
}

async function getAllocationById(allocationId) {
    const [rows] = await pool.query(`
        SELECT
            ra.allocation_id,
            ra.resource_request_id,
            ra.optimization_run_id,
            ra.allocated_by,
            ra.allocation_status,
            ra.created_at,

            rr.request_status,
            rr.priority,
            rr.state_id,

            s.state_name,

            rai.allocation_item_id,
            rai.resource_id,
            r.resource_name,
            r.unit,
            rai.quantity_allocated,

            w.warehouse_id,
            w.warehouse_name,

            rm.movement_id,
            rm.movement_status,
            rm.tracking_reference,
            rm.dispatched_at,
            rm.delivered_at

        FROM resource_allocations ra

        JOIN resource_requests rr
            ON rr.resource_request_id = ra.resource_request_id

        JOIN states s
            ON s.state_id = rr.state_id

        JOIN resource_allocation_items rai
            ON rai.allocation_id = ra.allocation_id

        JOIN resources r
            ON r.resource_id = rai.resource_id

        JOIN warehouses w
            ON w.warehouse_id = rai.warehouse_id

        LEFT JOIN resource_movements rm
            ON rm.allocation_id = ra.allocation_id
            AND rm.resource_id = rai.resource_id
            AND rm.from_warehouse_id = rai.warehouse_id

        WHERE ra.allocation_id = ?

        ORDER BY rai.allocation_item_id
    `, [allocationId]);

    return rows;
}

module.exports = {
    getAllAllocations,
    getAllocationById
};
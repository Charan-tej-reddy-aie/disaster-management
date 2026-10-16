const pool = require("../config/database");

/**
 * Get warehouses assigned or accessible to the logged-in user
 */
const getManagedWarehouses = async (req, res) => {
    try {
        const { role, userId, stateId } = req.user;

        let query = `
            SELECT
                w.warehouse_id,
                w.warehouse_name,
                w.state_id,
                w.district_id,
                w.department_id,
                w.manager_user_id,
                w.latitude,
                w.longitude,
                w.address,
                s.state_name,
                d.district_name,
                dep.department_name,
                u.full_name AS manager_name,
                u.email AS manager_email
            FROM warehouses w
            LEFT JOIN states s ON w.state_id = s.state_id
            LEFT JOIN districts d ON w.district_id = d.district_id
            LEFT JOIN departments dep ON w.department_id = dep.department_id
            LEFT JOIN users u ON w.manager_user_id = u.user_id
        `;
        let params = [];

        if (role === "WAREHOUSE_MANAGER") {
            query += " WHERE w.manager_user_id = ? ORDER BY w.warehouse_name";
            params = [userId];
        } else if (role === "STATE_HEAD") {
            query += " WHERE w.state_id = ? ORDER BY w.warehouse_name";
            params = [stateId];
        } else {
            // NATIONAL_HEAD, DEPARTMENT_HEAD, etc.
            query += " ORDER BY s.state_name, w.warehouse_name";
        }

        const [rows] = await pool.query(query, params);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching managed warehouses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouses"
        });
    }
};

/**
 * Dedicated Dashboard endpoint for Warehouse Managers
 */
const getWarehouseManagerDashboard = async (req, res) => {
    try {
        const { role, userId, stateId } = req.user;
        let warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : null;

        // 1. Identify which warehouse to show
        let warehouseQuery = `
            SELECT
                w.warehouse_id,
                w.warehouse_name,
                w.state_id,
                w.district_id,
                w.department_id,
                w.manager_user_id,
                w.latitude,
                w.longitude,
                w.address,
                s.state_name,
                d.district_name,
                dep.department_name,
                u.full_name AS manager_name,
                u.email AS manager_email
            FROM warehouses w
            LEFT JOIN states s ON w.state_id = s.state_id
            LEFT JOIN districts d ON w.district_id = d.district_id
            LEFT JOIN departments dep ON w.department_id = dep.department_id
            LEFT JOIN users u ON w.manager_user_id = u.user_id
        `;
        let warehouseParams = [];

        if (role === "WAREHOUSE_MANAGER") {
            warehouseQuery += " WHERE w.manager_user_id = ? LIMIT 1";
            warehouseParams = [userId];
        } else if (warehouseId) {
            warehouseQuery += " WHERE w.warehouse_id = ? LIMIT 1";
            warehouseParams = [warehouseId];
        } else if (role === "STATE_HEAD") {
            warehouseQuery += " WHERE w.state_id = ? ORDER BY w.warehouse_id ASC LIMIT 1";
            warehouseParams = [stateId];
        } else {
            // Default to first warehouse for National Head if not specified
            warehouseQuery += " ORDER BY w.warehouse_id ASC LIMIT 1";
        }

        const [warehouses] = await pool.query(warehouseQuery, warehouseParams);

        if (warehouses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No warehouse found assigned to your account."
            });
        }

        const currentWarehouse = warehouses[0];
        const targetWarehouseId = currentWarehouse.warehouse_id;

        // 2. Fetch inventory for this warehouse
        const [inventory] = await pool.query(`
            SELECT
                wr.warehouse_resource_id,
                wr.warehouse_id,
                r.resource_id,
                r.resource_name,
                r.unit,
                rc.resource_category_id,
                rc.category_name,
                wr.quantity_available,
                wr.quantity_reserved,
                GREATEST(wr.quantity_available - wr.quantity_reserved, 0) AS quantity_usable
            FROM warehouse_resources wr
            INNER JOIN resources r ON wr.resource_id = r.resource_id
            INNER JOIN resource_categories rc ON r.resource_category_id = rc.resource_category_id
            WHERE wr.warehouse_id = ?
            ORDER BY rc.category_name, r.resource_name
        `, [targetWarehouseId]);

        // 3. Compute inventory summary statistics
        let totalAvailable = 0;
        let totalReserved = 0;
        let totalUsable = 0;

        for (const item of inventory) {
            totalAvailable += Number(item.quantity_available || 0);
            totalReserved += Number(item.quantity_reserved || 0);
            totalUsable += Number(item.quantity_usable || 0);
        }

        // 4. Fetch allocations assigned to this warehouse
        const [allocations] = await pool.query(`
            SELECT DISTINCT
                ra.allocation_id,
                ra.resource_request_id,
                ra.allocation_status,
                ra.created_at,
                s.state_name AS target_state,
                rr.priority,
                rr.reason,
                (
                    SELECT SUM(rai.quantity_allocated) 
                    FROM resource_allocation_items rai 
                    WHERE rai.allocation_id = ra.allocation_id 
                      AND rai.warehouse_id = ?
                ) AS warehouse_allocated_qty
            FROM resource_allocation_items rai
            JOIN resource_allocations ra ON rai.allocation_id = ra.allocation_id
            JOIN resource_requests rr ON ra.resource_request_id = rr.resource_request_id
            JOIN states s ON rr.state_id = s.state_id
            WHERE rai.warehouse_id = ?
            ORDER BY ra.created_at DESC
        `, [targetWarehouseId, targetWarehouseId]);

        // 5. Fetch resource movements involving this warehouse
        const [movements] = await pool.query(`
            SELECT
                rm.movement_id,
                rm.allocation_id,
                rm.from_warehouse_id,
                rm.to_state_id,
                rm.to_district_id,
                rm.resource_id,
                rm.quantity,
                rm.movement_status,
                rm.dispatched_at,
                rm.delivered_at,
                rm.tracking_reference,
                rm.created_at,
                r.resource_name,
                r.unit,
                s.state_name AS destination_state,
                (
                    SELECT transaction_hash 
                    FROM blockchain_transactions 
                    WHERE entity_type = 'RESOURCE_MOVEMENT' 
                      AND entity_id = rm.movement_id 
                    ORDER BY blockchain_transaction_id DESC 
                    LIMIT 1
                ) AS blockchain_tx_hash
            FROM resource_movements rm
            JOIN resources r ON rm.resource_id = r.resource_id
            JOIN states s ON rm.to_state_id = s.state_id
            WHERE rm.from_warehouse_id = ?
            ORDER BY rm.movement_id DESC
        `, [targetWarehouseId]);

        // 6. Movement stats
        const movementStats = {
            total: movements.length,
            planned: movements.filter(m => m.movement_status === "PLANNED").length,
            dispatched: movements.filter(m => m.movement_status === "DISPATCHED").length,
            inTransit: movements.filter(m => m.movement_status === "IN_TRANSIT").length,
            delivered: movements.filter(m => m.movement_status === "DELIVERED").length
        };

        return res.json({
            success: true,
            data: {
                warehouse: currentWarehouse,
                inventory,
                stockSummary: {
                    resourceTypesCount: inventory.length,
                    totalAvailable,
                    totalReserved,
                    totalUsable
                },
                allocations,
                movements,
                movementStats
            }
        });

    } catch (error) {
        console.error("Warehouse Manager dashboard error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load warehouse dashboard: " + error.message
        });
    }
};

const getWarehousesByState = async (req, res) => {
    try {
        const { stateId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                w.warehouse_id,
                w.warehouse_name,
                w.state_id,
                w.district_id,
                w.department_id,
                w.manager_user_id,
                w.latitude,
                w.longitude,
                w.address,
                d.district_name,
                dep.department_name,
                u.full_name AS manager_name
            FROM warehouses w
            LEFT JOIN districts d ON w.district_id = d.district_id
            LEFT JOIN departments dep ON w.department_id = dep.department_id
            LEFT JOIN users u ON w.manager_user_id = u.user_id
            WHERE w.state_id = ?
            ORDER BY w.warehouse_name
        `, [stateId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Error fetching warehouses:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouses"
        });
    }
};

module.exports = {
    getWarehousesByState,
    getManagedWarehouses,
    getWarehouseManagerDashboard
};
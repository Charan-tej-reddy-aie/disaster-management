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

/**
 * Create a stock replenishment request for a warehouse when resources run low or are out-of-stock
 */
const createWarehouseStockRequest = async (req, res) => {
    try {
        const { warehouseId, resourceId, quantityRequested, priority, reason, allotmentSource } = req.body;
        const requestedBy = req.user.userId;

        if (!warehouseId || !resourceId || !quantityRequested || Number(quantityRequested) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Warehouse ID, Resource ID, and a valid quantity are required."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO warehouse_stock_requests 
             (warehouse_id, resource_id, requested_by, quantity_requested, priority, status, allotment_source, reason)
             VALUES (?, ?, ?, ?, ?, 'PENDING_ALLOTMENT', ?, ?)`,
            [
                warehouseId,
                resourceId,
                requestedBy,
                Number(quantityRequested),
                priority || "HIGH",
                allotmentSource || "CENTRAL_NATIONAL_RESERVE",
                reason || "Warehouse stock depletion emergency replenishment"
            ]
        );

        const stockRequestId = result.insertId;

        // Audit log entry
        try {
            await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
                 VALUES (?, 'CREATE_STOCK_REQUEST', 'WAREHOUSE_STOCK_REQUEST', ?, JSON_OBJECT('warehouse_id', ?, 'resource_id', ?, 'quantity', ?))`,
                [requestedBy, stockRequestId, warehouseId, resourceId, quantityRequested]
            );
        } catch (auditErr) {
            console.warn("Audit log notice:", auditErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Warehouse stock replenishment request created successfully.",
            data: {
                stockRequestId,
                warehouseId,
                resourceId,
                quantityRequested,
                status: "PENDING_ALLOTMENT"
            }
        });
    } catch (error) {
        console.error("Error creating warehouse stock request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create stock request: " + error.message
        });
    }
};

/**
 * Get all warehouse stock requests (optionally filtered by warehouseId or status)
 */
const getWarehouseStockRequests = async (req, res) => {
    try {
        const { warehouseId, status } = req.query;

        let query = `
            SELECT 
                wsr.stock_request_id,
                wsr.warehouse_id,
                w.warehouse_name,
                s.state_name,
                wsr.resource_id,
                r.resource_name,
                r.unit,
                rc.category_name,
                wsr.quantity_requested,
                wsr.quantity_allotted,
                wsr.priority,
                wsr.status,
                wsr.allotment_source,
                wsr.reason,
                u_req.full_name AS requested_by_name,
                u_allot.full_name AS allotted_by_name,
                wsr.allotted_at,
                wsr.created_at
            FROM warehouse_stock_requests wsr
            JOIN warehouses w ON wsr.warehouse_id = w.warehouse_id
            JOIN states s ON w.state_id = s.state_id
            JOIN resources r ON wsr.resource_id = r.resource_id
            JOIN resource_categories rc ON r.resource_category_id = rc.resource_category_id
            JOIN users u_req ON wsr.requested_by = u_req.user_id
            LEFT JOIN users u_allot ON wsr.allotted_by = u_allot.user_id
        `;
        const params = [];
        const conditions = [];

        if (warehouseId) {
            conditions.push("wsr.warehouse_id = ?");
            params.push(Number(warehouseId));
        }
        if (status) {
            conditions.push("wsr.status = ?");
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY wsr.created_at DESC";

        const [rows] = await pool.query(query, params);

        return res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching warehouse stock requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch stock requests: " + error.message
        });
    }
};

/**
 * Allot requested stock to a warehouse from Central National Reserve or Inter-Warehouse transfer
 */
const allotWarehouseStock = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const stockRequestId = Number(req.params.id);
        const allottedBy = req.user.userId;
        const { quantityAllotted, source } = req.body;

        const [reqRows] = await connection.query(
            `SELECT * FROM warehouse_stock_requests WHERE stock_request_id = ? FOR UPDATE`,
            [stockRequestId]
        );

        if (reqRows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: "Stock request not found." });
        }

        const stockReq = reqRows[0];
        if (stockReq.status === "ALLOTTED") {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ success: false, message: "This stock request has already been allotted." });
        }

        const qty = quantityAllotted ? Number(quantityAllotted) : Number(stockReq.quantity_requested);

        // 1. Update stock request to ALLOTTED
        await connection.query(
            `UPDATE warehouse_stock_requests 
             SET status = 'ALLOTTED', quantity_allotted = ?, allotted_by = ?, allotted_at = NOW(), allotment_source = COALESCE(?, allotment_source)
             WHERE stock_request_id = ?`,
            [qty, allottedBy, source || null, stockRequestId]
        );

        // 2. Replenish warehouse inventory: increment quantity_available
        await connection.query(
            `INSERT INTO warehouse_resources (warehouse_id, resource_id, quantity_available, quantity_reserved)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE quantity_available = quantity_available + ?`,
            [stockReq.warehouse_id, stockReq.resource_id, qty, qty]
        );

        // 3. Record in audit_logs
        try {
            await connection.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_data)
                 VALUES (?, 'ALLOT_STOCK', 'WAREHOUSE_STOCK_REQUEST', ?, JSON_OBJECT('warehouse_id', ?, 'resource_id', ?, 'quantity_allotted', ?, 'source', ?))`,
                [allottedBy, stockRequestId, stockReq.warehouse_id, stockReq.resource_id, qty, source || stockReq.allotment_source]
            );
        } catch (auditErr) {
            console.warn("Audit log notice:", auditErr.message);
        }

        // 4. Record transaction in blockchain_transactions
        const pseudoTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join("");
        try {
            await connection.query(
                `INSERT INTO blockchain_transactions 
                 (entity_type, entity_id, transaction_hash, blockchain_network, block_number, transaction_status)
                 VALUES ('STOCK_ALLOTMENT', ?, ?, 'Hardhat Localhost (ChainID 31337)', FLOOR(1000000 + RAND() * 9000000), 'CONFIRMED')`,
                [stockRequestId, pseudoTxHash]
            );
        } catch (chainErr) {
            console.warn("Blockchain log notice:", chainErr.message);
        }

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: `Successfully allotted ${qty.toLocaleString()} units to warehouse from ${source || stockReq.allotment_source}. Inventory updated!`,
            data: {
                stockRequestId,
                warehouseId: stockReq.warehouse_id,
                resourceId: stockReq.resource_id,
                quantityAllotted: qty,
                status: "ALLOTTED",
                txHash: pseudoTxHash
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error("Error allotting warehouse stock:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to allot stock: " + error.message
        });
    }
};

module.exports = {
    getWarehousesByState,
    getManagedWarehouses,
    getWarehouseManagerDashboard,
    createWarehouseStockRequest,
    getWarehouseStockRequests,
    allotWarehouseStock
};
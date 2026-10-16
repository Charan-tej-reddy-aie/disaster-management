const pool = require("../config/database");

const getWarehouseInventory = async (req, res) => {
    try {
        const { warehouseId } = req.params;

        // Verify warehouse exists and enforce access control
        const [warehouseCheck] = await pool.query(
            "SELECT warehouse_id, state_id, manager_user_id FROM warehouses WHERE warehouse_id = ?",
            [warehouseId]
        );

        if (warehouseCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Warehouse not found"
            });
        }

        const warehouse = warehouseCheck[0];

        // Access enforcement
        if (req.user.role === "WAREHOUSE_MANAGER" && Number(warehouse.manager_user_id) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are only authorized to access inventory for your assigned warehouse."
            });
        }

        if (req.user.role === "STATE_HEAD" && Number(warehouse.state_id) !== Number(req.user.stateId)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are only authorized to access warehouses in your state."
            });
        }

        const [rows] = await pool.query(`
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
            INNER JOIN resources r
                ON wr.resource_id = r.resource_id
            INNER JOIN resource_categories rc
                ON r.resource_category_id = rc.resource_category_id
            WHERE wr.warehouse_id = ?
            ORDER BY rc.category_name, r.resource_name
        `, [warehouseId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Error fetching inventory:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch warehouse inventory"
        });
    }
};

module.exports = {
    getWarehouseInventory
};
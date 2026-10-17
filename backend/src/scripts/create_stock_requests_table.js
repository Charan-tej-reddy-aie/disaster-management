const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("../config/database");

async function initStockRequestsTable() {
    try {
        const createTableSql = `
        CREATE TABLE IF NOT EXISTS warehouse_stock_requests (
            stock_request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            warehouse_id BIGINT UNSIGNED NOT NULL,
            resource_id BIGINT UNSIGNED NOT NULL,
            requested_by BIGINT UNSIGNED NOT NULL,
            quantity_requested DECIMAL(15,3) NOT NULL,
            quantity_allotted DECIMAL(15,3) NOT NULL DEFAULT 0,
            priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
            status ENUM('PENDING_ALLOTMENT', 'ALLOTTED', 'REJECTED') NOT NULL DEFAULT 'PENDING_ALLOTMENT',
            allotment_source VARCHAR(100) NOT NULL DEFAULT 'CENTRAL_NATIONAL_RESERVE',
            reason TEXT NULL,
            allotted_by BIGINT UNSIGNED NULL,
            allotted_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_wsr_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (warehouse_id) ON DELETE CASCADE,
            CONSTRAINT fk_wsr_resource FOREIGN KEY (resource_id) REFERENCES resources (resource_id) ON DELETE RESTRICT,
            CONSTRAINT fk_wsr_user FOREIGN KEY (requested_by) REFERENCES users (user_id) ON DELETE RESTRICT
        );`;

        await pool.query(createTableSql);
        console.log("✓ Table warehouse_stock_requests created or verified successfully.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create table:", err);
        process.exit(1);
    }
}

initStockRequestsTable();

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const pool = require("./src/config/database");
const disasterRoutes = require("./src/routes/disasterRoutes");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const stateRoutes = require("./src/routes/stateRoutes");
const departmentRoutes = require("./src/routes/departmentRoutes");
const warehouseRoutes = require("./src/routes/warehouseRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const satelliteRoutes = require("./src/routes/satelliteRoutes");
const weatherRoutes = require("./src/routes/weatherRoutes");
const resourceRequirementRoutes = require("./src/routes/resourceRequirementRoutes");
const resourceRequestRoutes = require("./src/routes/resourceRequestRoutes");
const resourceRequestApprovalRoutes = require("./src/routes/resourceRequestApprovalRoutes");
const nationalApprovalRoutes = require("./src/routes/nationalApprovalRoutes");
const resourceAllocationRoutes = require("./src/routes/resourceAllocationRoutes");
const resourceMovementRoutes = require("./src/routes/resourceMovementRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const mlPredictionRoutes = require("./src/routes/mlPredictionRoutes");
const livePredictionRoutes =
    require("./src/routes/livePredictionRoutes");
const monitoringRoutes =
    require("./src/routes/monitoringRoutes");
const resourceAllocationQueryRoutes =
    require("./src/routes/resourceAllocationQueryRoutes");
const predictionHistoryRoutes =
    require("./src/routes/predictionHistoryRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/disasters", disasterRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/satellite", satelliteRoutes);
app.use(
  "/satellite-images",
  express.static(
    path.join(__dirname, "public/satellite-images")
  )
);
app.use("/api/weather", weatherRoutes);
app.use(
  "/api/resource-requirements",
  resourceRequirementRoutes
);
app.use(
  "/api/resource-requests",
  resourceRequestRoutes
);
app.use(
  "/api/resource-requests",
  resourceRequestApprovalRoutes
);
app.use(
  "/api/resource-requests/national",
  nationalApprovalRoutes
);
app.use(
  "/api/resource-allocations",
  resourceAllocationRoutes
);

app.use(
    "/api/predictions",
    livePredictionRoutes
);

app.use(
    "/api/allocations",
    resourceAllocationQueryRoutes
);
app.use(
  "/api/resource-movements",
  resourceMovementRoutes
);
app.use("/api/disasters", dashboardRoutes);

app.use("/api/resources", resourceRoutes);

app.use("/api/ml", mlPredictionRoutes);

app.use("/api/prediction-history", predictionHistoryRoutes);

app.use(
  "/api/monitoring",
  monitoringRoutes
);


app.get("/", (req, res) => {
    res.json({
        message: "Disaster Management API is running"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS database_status");

        res.json({
            server: "OK",
            database: rows[0].database_status === 1 ? "CONNECTED" : "ERROR"
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            server: "OK",
            database: "DISCONNECTED"
        });
    }
});

const PORT = process.env.PORT || 5000;

async function autoInitTables() {
    try {
        await pool.query(`
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
            );
        `);
        console.log("Database tables verified (including warehouse_stock_requests).");
    } catch (e) {
        console.warn("Table autoInit warning:", e.message);
    }
}

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await autoInitTables();
});
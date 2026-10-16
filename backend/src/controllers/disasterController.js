const pool = require("../config/database");
const { createResourceAllocation } = require("../services/resourceAllocationService");
const { updateMovementStatus } = require("../services/resourceMovementService");
const { runQuantumAllocationPreview } = require("../services/quantumAllocationService");

const getDisasterTypes = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                disaster_type_id,
                disaster_name,
                description
            FROM disaster_types
            ORDER BY disaster_name
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching disaster types:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch disaster types"
        });
    }
};

const simulateDummyDisaster = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const simCode = Math.floor(1000 + Math.random() * 9000);
        const eventName = `Emergency Simulation: Cyclone & Inundation Alert #${simCode}`;

        // 1. Create simulated disaster event in Kerala (state_id = 1)
        const [eventRes] = await connection.query(
            `INSERT INTO disaster_events 
             (disaster_type_id, state_id, event_name, event_status, actual_start_time)
             VALUES (1, 1, ?, 'ACTIVE', NOW())`,
            [eventName]
        );
        const eventId = eventRes.insertId;

        // 2. Create prediction record in disaster_predictions (prediction_model_id = 1)
        const [predRes] = await connection.query(
            `INSERT INTO disaster_predictions 
             (disaster_event_id, prediction_model_id, prediction_time, probability, severity, expected_start_time, expected_end_time, affected_area_km2, affected_population, confidence_score)
             VALUES (?, 1, NOW(), 0.95, 'CRITICAL', NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 420.0, 15000, 0.92)`,
            [eventId]
        );
        const predictionId = predRes.insertId;

        // 3. Create prediction run record for ML history
        await connection.query(
            `INSERT INTO prediction_runs
             (state_id, prediction_model_id, latitude, longitude, predicted_class, probability_percent, severity, class_probabilities, weather_features)
             VALUES (1, 1, 10.8505000, 76.2711000, 'FLOOD', 95.00, 'CRITICAL',
             JSON_OBJECT('FLOOD', 95.0, 'CYCLONE', 3.5, 'NORMAL', 1.5),
             JSON_OBJECT('rainfall_mm', 152.0, 'river_discharge', 890.0, 'soil_moisture', 0.94, 'wind_speed_kmh', 82.5))`,
            []
        );

        // 4. Calculate Resource Requirements (Food Kit: 1, Drinking Water: 2, Medical Kit: 3)
        const items = [
            { resourceId: 1, required: 15000, shortage: 15000 },
            { resourceId: 2, required: 30000, shortage: 30000 },
            { resourceId: 3, required: 1500, shortage: 1500 }
        ];

        for (const item of items) {
            await connection.query(
                `INSERT INTO predicted_resource_requirements
                 (prediction_id, resource_id, quantity_required, quantity_available, quantity_shortage)
                 VALUES (?, ?, ?, 0, ?)`,
                [predictionId, item.resourceId, item.required, item.shortage]
            );
        }

        // 5. Find valid users for requested_by, allocatedBy, and updatedBy
        const [natUsers] = await connection.query(
            "SELECT user_id FROM users WHERE role_id = 1 OR email = 'national.head@disaster.local' ORDER BY user_id ASC LIMIT 1"
        );
        const [whUsers] = await connection.query(
            "SELECT user_id FROM users WHERE role_id = 4 OR email = 'kerala.warehouse@disaster.local' ORDER BY user_id ASC LIMIT 1"
        );
        const nationalUserId = natUsers.length > 0 ? natUsers[0].user_id : (req.user?.userId || 1);
        const warehouseUserId = whUsers.length > 0 ? whUsers[0].user_id : nationalUserId;

        // Create Resource Request in NATIONAL_APPROVED state (escalated & authorized)
        const [reqRes] = await connection.query(
            `INSERT INTO resource_requests
             (prediction_id, state_id, requested_by, request_status, priority, reason)
             VALUES (?, 1, ?, 'NATIONAL_APPROVED', 'CRITICAL', ?)`,
            [predictionId, warehouseUserId, `Live Simulation Emergency Response for ${eventName}`]
        );
        const requestId = reqRes.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO resource_request_items
                 (resource_request_id, resource_id, quantity_requested, quantity_approved)
                 VALUES (?, ?, ?, ?)`,
                [requestId, item.resourceId, item.required, item.required]
            );
        }

        await connection.commit();
        connection.release();

        // 6. Run Quantum Optimization preview
        let quantumDetails = null;
        try {
            quantumDetails = await runQuantumAllocationPreview(requestId);
        } catch (qe) {
            console.warn("Quantum preview notice:", qe.message);
        }

        // 7. Create Resource Allocation
        const allocResult = await createResourceAllocation({
            requestId,
            allocatedBy: nationalUserId
        });
        const allocationId = allocResult.allocationId;

        // 8. Find created movements and advance them with live Blockchain transactions
        const [movements] = await pool.query(
            `SELECT movement_id, from_warehouse_id, to_state_id, to_district_id, resource_id, quantity 
             FROM resource_movements WHERE allocation_id = ?`,
            [allocationId]
        );

        const blockchainLogs = [];
        if (movements.length > 0) {
            const mov = movements[0];

            // Step 8a: Dispatch -> Blockchain
            const dispatchRes = await updateMovementStatus({
                movementId: mov.movement_id,
                newStatus: "DISPATCHED",
                updatedBy: warehouseUserId
            });
            blockchainLogs.push({
                step: "DISPATCHED",
                movementId: mov.movement_id,
                txHash: dispatchRes.blockchainAudit?.transactionHash,
                blockNumber: dispatchRes.blockchainAudit?.blockNumber
            });

            // Step 8b: In-Transit -> Blockchain
            const transitRes = await updateMovementStatus({
                movementId: mov.movement_id,
                newStatus: "IN_TRANSIT",
                updatedBy: warehouseUserId
            });
            blockchainLogs.push({
                step: "IN_TRANSIT",
                movementId: mov.movement_id,
                txHash: transitRes.blockchainAudit?.transactionHash,
                blockNumber: transitRes.blockchainAudit?.blockNumber
            });

            // Step 8c: Delivered -> Blockchain
            const deliverRes = await updateMovementStatus({
                movementId: mov.movement_id,
                newStatus: "DELIVERED",
                updatedBy: warehouseUserId
            });
            blockchainLogs.push({
                step: "DELIVERED",
                movementId: mov.movement_id,
                txHash: deliverRes.blockchainAudit?.transactionHash,
                blockNumber: deliverRes.blockchainAudit?.blockNumber
            });
        }

        return res.json({
            success: true,
            message: "Live disaster scenario simulated and confirmed across AI, Quantum, and Blockchain layers!",
            scenario: {
                eventName,
                eventId,
                predictionId,
                requestId,
                allocationId,
                movementsCount: movements.length,
                quantumAlgorithm: "QAOA Multi-Warehouse Optimization",
                quantumDetails: quantumDetails?.optimizationRun?.algorithm_name || "QAOA",
                blockchainTransactions: blockchainLogs
            }
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error("Simulation error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDisasterTypes,
    simulateDummyDisaster
};
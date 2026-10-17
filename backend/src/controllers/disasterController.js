const pool = require("../config/database");

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

        await connection.commit();
        connection.release();

        return res.json({
            success: true,
            message: "New disaster alert generated successfully!",
            scenario: {
                eventName,
                eventId,
                predictionId,
                stateId: 1,
                stateName: "Kerala",
                severity: "CRITICAL",
                probability: 0.95,
                affectedPopulation: 15000,
                affectedAreaKm2: 420.0,
                items: [
                    { resourceName: "Emergency Food Kits", quantity: 15000, unit: "Kits" },
                    { resourceName: "Clean Drinking Water", quantity: 30000, unit: "Litres" },
                    { resourceName: "Emergency Medical Kits", quantity: 1500, unit: "Kits" }
                ]
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
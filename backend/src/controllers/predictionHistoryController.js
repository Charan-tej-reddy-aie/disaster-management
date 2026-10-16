
const pool = require("../config/database");

async function getPredictionHistory(req, res) {
    try {
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 50, 1),
            100
        );

        const [rows] = await pool.query(
            `
            SELECT
                pr.run_id,
                pr.state_id,
                s.state_name,
                pr.latitude,
                pr.longitude,
                pr.predicted_class,
                pr.probability_percent,
                pr.severity,
                pr.class_probabilities,
                pr.created_at
            FROM prediction_runs pr
            INNER JOIN states s
                ON s.state_id = pr.state_id
            ORDER BY pr.created_at DESC, pr.run_id DESC
            LIMIT ?
            `,
            [limit]
        );

        res.json({
            success: true,
            count: rows.length,
            predictions: rows
        });
    } catch (error) {
        console.error("Prediction history error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve prediction history"
        });
    }
}

module.exports = { getPredictionHistory };

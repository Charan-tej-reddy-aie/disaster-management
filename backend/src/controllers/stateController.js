const pool = require("../config/database");

const getStates = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                s.state_id,
                s.state_name,
                s.state_code,
                c.country_name
            FROM states s
            INNER JOIN countries c
                ON s.country_id = c.country_id
            ORDER BY s.state_name
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Error fetching states:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch states"
        });
    }
};

const getStateById = async (req, res) => {
    try {
        const { stateId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                s.state_id,
                s.state_name,
                s.state_code,
                c.country_name
            FROM states s
            INNER JOIN countries c
                ON s.country_id = c.country_id
            WHERE s.state_id = ?
        `, [stateId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "State not found"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Error fetching state:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch state"
        });
    }
};

module.exports = {
    getStates,
    getStateById
};
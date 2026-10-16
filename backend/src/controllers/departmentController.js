const pool = require("../config/database");

const getDepartmentsByState = async (req, res) => {
    try {
        const { stateId } = req.params;

        const [rows] = await pool.query(`
            SELECT
                department_id,
                state_id,
                department_name,
                department_code,
                description
            FROM departments
            WHERE state_id = ?
            ORDER BY department_name
        `, [stateId]);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Error fetching departments:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch departments"
        });
    }
};

module.exports = {
    getDepartmentsByState
};
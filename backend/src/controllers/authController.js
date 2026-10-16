const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await pool.query(
            `
            SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.password_hash,
                u.is_active,
                r.role_id,
                r.role_name,
                u.state_id,
                u.district_id
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.email = ?
            LIMIT 1
            `,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "User account is inactive"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.user_id,
                roleId: user.role_id,
                role: user.role_name,
                stateId: user.state_id,
                districtId: user.district_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role_name,
                stateId: user.state_id,
                districtId: user.district_id
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    login
};
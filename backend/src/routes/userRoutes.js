const express = require("express");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/profile",
    authenticate,
    (req, res) => {
        res.json({
            success: true,
            user: req.user
        });
    }
);

router.get(
    "/national-only",
    authenticate,
    authorizeRoles("NATIONAL_HEAD"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome National Head"
        });
    }
);

router.get(
    "/state-access",
    authenticate,
    authorizeRoles(
        "NATIONAL_HEAD",
        "STATE_HEAD"
    ),
    (req, res) => {
        res.json({
            success: true,
            message: "You have state-level access"
        });
    }
);

module.exports = router;
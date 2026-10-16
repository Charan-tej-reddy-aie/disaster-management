const express = require("express");

const {
    getDepartmentsByState
} = require("../controllers/departmentController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/state/:stateId",
    authenticate,
    authorizeRoles(
        "NATIONAL_HEAD",
        "STATE_HEAD",
        "DEPARTMENT_HEAD"
    ),
    getDepartmentsByState
);

module.exports = router;
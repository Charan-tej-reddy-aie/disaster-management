const express = require("express");

const {
    getWarehousesByState,
    getManagedWarehouses,
    getWarehouseManagerDashboard
} = require("../controllers/warehouseController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Get warehouses accessible to the logged-in user
router.get(
    "/managed",
    authenticate,
    getManagedWarehouses
);

// Dedicated warehouse manager dashboard
router.get(
    "/manager/dashboard",
    authenticate,
    authorizeRoles("WAREHOUSE_MANAGER", "NATIONAL_HEAD", "STATE_HEAD"),
    getWarehouseManagerDashboard
);

router.get(
    "/state/:stateId",
    authenticate,
    authorizeRoles(
        "NATIONAL_HEAD",
        "STATE_HEAD",
        "DEPARTMENT_HEAD",
        "WAREHOUSE_MANAGER"
    ),
    getWarehousesByState
);

module.exports = router;
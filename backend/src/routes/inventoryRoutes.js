const express = require("express");

const {
    getWarehouseInventory
} = require("../controllers/inventoryController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/warehouse/:warehouseId",
    authenticate,
    authorizeRoles(
        "NATIONAL_HEAD",
        "STATE_HEAD",
        "DEPARTMENT_HEAD",
        "WAREHOUSE_MANAGER"
    ),
    getWarehouseInventory
);

module.exports = router;
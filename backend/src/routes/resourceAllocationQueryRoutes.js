const express = require("express");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    getAllocations,
    getAllocation
} = require("../controllers/resourceAllocationQueryController");

const router = express.Router();

router.get(
    "/all",
    authenticate,
    getAllocations
);

router.get(
    "/:id",
    authenticate,
    getAllocation
);

module.exports = router;
const express = require("express");

const {
    getDisasterTypes,
    simulateDummyDisaster,
    createDisasterPrediction
} = require("../controllers/disasterController");

const router = express.Router();

router.get("/types", getDisasterTypes);
router.post("/simulate-dummy", simulateDummyDisaster);
router.post("/create", createDisasterPrediction);

module.exports = router;
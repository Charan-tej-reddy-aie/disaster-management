const express = require("express");

const {
    getDisasterTypes,
    simulateDummyDisaster
} = require("../controllers/disasterController");

const router = express.Router();

router.get("/types", getDisasterTypes);
router.post("/simulate-dummy", simulateDummyDisaster);

module.exports = router;
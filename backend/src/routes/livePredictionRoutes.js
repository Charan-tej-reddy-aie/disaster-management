const express = require("express");

const {
    runPrediction
} = require("../controllers/livePredictionController");

const router = express.Router();

router.post(
    "/run",
    runPrediction
);

module.exports = router;
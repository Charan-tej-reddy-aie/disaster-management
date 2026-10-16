
const express = require("express");

const {
    getPredictionHistory
} = require("../controllers/predictionHistoryController");

const router = express.Router();

router.get("/", getPredictionHistory);

module.exports = router;


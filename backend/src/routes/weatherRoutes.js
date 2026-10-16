const express = require("express");

const router = express.Router();

const {
    ingestWeather
} = require("../controllers/weatherController");

const {
    authenticate
} = require("../middleware/authMiddleware");

router.get(
    "/current",
    authenticate,
    ingestWeather
);

module.exports = router;
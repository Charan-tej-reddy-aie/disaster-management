const express = require("express");

const router = express.Router();

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    getSatelliteImage,
    getSentinel1Image
} = require("../controllers/satelliteController");

router.get(
    "/image",
    authenticate,
    getSatelliteImage
);

router.get(
    "/sentinel1/image",
    authenticate,
    getSentinel1Image
);

module.exports = router;
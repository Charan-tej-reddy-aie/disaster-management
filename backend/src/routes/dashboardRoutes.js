const express = require("express");

const router = express.Router();

const {
  getDashboard,
  getPredictions,
  getStats,
} = require("../controllers/dashboardController");

const {
  authenticate,
} = require("../middleware/authMiddleware");


router.get(
  "/dashboard",
  authenticate,
  getDashboard
);


router.get(
  "/predictions",
  authenticate,
  getPredictions
);


router.get(
  "/stats",
  authenticate,
  getStats
);


module.exports = router;
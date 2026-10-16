const express = require("express");

const {
  getStateMonitoring,
  getMonitoringStatistics,
  getRecentPredictions,
  getAllBlockchainAudits
} = require("../controllers/monitoringController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/states",
  authenticate,
  getStateMonitoring
);

router.get(
  "/statistics",
  authenticate,
  getMonitoringStatistics
);

router.get(
  "/recent",
  authenticate,
  getRecentPredictions
);

router.get(
  "/blockchain/all",
  authenticate,
  getAllBlockchainAudits
);

module.exports = router;
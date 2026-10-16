const express = require("express");

const {
  getResources,
  getSummary
} = require("../controllers/resourceController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/all",
  authenticate,
  getResources
);

router.get(
  "/summary",
  authenticate,
  getSummary
);

module.exports = router;
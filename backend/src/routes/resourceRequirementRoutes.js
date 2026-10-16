const express = require("express");

const {
  getResourceRequirements,
  generateRequirements
} = require("../controllers/resourceRequirementController");

const {
  authenticate
} = require("../middleware/authMiddleware");


const router = express.Router();


// ==========================================================
// GET
// Calculate resource requirements
// ==========================================================

router.get(
  "/prediction/:predictionId",
  authenticate,
  getResourceRequirements
);


// ==========================================================
// POST
// Generate and save resource requirements
// ==========================================================

router.post(
  "/prediction/:predictionId/generate",
  authenticate,
  generateRequirements
);


module.exports = router;
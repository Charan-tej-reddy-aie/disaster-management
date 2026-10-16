const express = require("express");

const {
  createResourceAllocation,
  runQuantumOptimization,
  createQuantumAllocation
} = require("../controllers/resourceAllocationController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// NATIONAL HEAD → CREATE NORMAL RESOURCE ALLOCATION
// ======================================================

router.post(
  "/:requestId/create",
  authenticate,
  createResourceAllocation
);


// ======================================================
// NATIONAL HEAD → RUN QUANTUM OPTIMIZATION
// ======================================================

router.post(
  "/:requestId/quantum-optimize",
  authenticate,
  runQuantumOptimization
);


// ======================================================
// NATIONAL HEAD → CREATE FINAL QUANTUM ALLOCATION
// ======================================================

router.post(
  "/:requestId/quantum-create",
  authenticate,
  createQuantumAllocation
);


module.exports = router;
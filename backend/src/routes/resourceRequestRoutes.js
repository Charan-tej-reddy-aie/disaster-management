const express = require("express");

const {
  createRequestFromShortage,
  getAllRequests,
  getStatePending,
  stateApprove,
  stateReject,
  getNationalPending,
  nationalApprove,
  nationalReject
} = require("../controllers/resourceRequestController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// CREATE RESOURCE REQUEST
// ============================================================

router.post(
  "/from-shortage",
  authenticate,
  createRequestFromShortage
);


// ============================================================
// GET ALL RESOURCE REQUESTS
// Used by:
// ResourceRequests.jsx
// QuantumOptimization.jsx
// ============================================================

router.get(
  "/all",
  authenticate,
  getAllRequests
);


// ============================================================
// STATE HEAD
// ============================================================

router.get(
  "/state/pending",
  authenticate,
  getStatePending
);


router.post(
  "/:id/state-approve",
  authenticate,
  stateApprove
);


router.post(
  "/:id/state-reject",
  authenticate,
  stateReject
);


// ============================================================
// NATIONAL HEAD
// ============================================================

router.get(
  "/national/pending",
  authenticate,
  getNationalPending
);


router.post(
  "/national/:id/approve",
  authenticate,
  nationalApprove
);


router.post(
  "/national/:id/reject",
  authenticate,
  nationalReject
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;
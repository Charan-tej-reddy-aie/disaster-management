const express = require("express");

const {
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/nationalApprovalController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// NATIONAL HEAD → VIEW PENDING REQUESTS
// ======================================================

router.get(
  "/pending",
  authenticate,
  getPendingRequests
);


// ======================================================
// NATIONAL HEAD → APPROVE
// ======================================================

router.post(
  "/:requestId/approve",
  authenticate,
  approveRequest
);


// ======================================================
// NATIONAL HEAD → REJECT
// ======================================================

router.post(
  "/:requestId/reject",
  authenticate,
  rejectRequest
);


module.exports = router;
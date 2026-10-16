const express = require("express");

const {
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/resourceRequestApprovalController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// State Head → pending requests
router.get(
  "/state/pending",
  authenticate,
  getPendingRequests
);


// State Head → approve
router.post(
  "/:requestId/state-approve",
  authenticate,
  approveRequest
);


// State Head → reject
router.post(
  "/:requestId/state-reject",
  authenticate,
  rejectRequest
);


module.exports = router;
const express = require("express");

const {
  dispatchMovement,
  markInTransit,
  deliverMovement,
  getMovements,
  getBlockchainAudits
} = require("../controllers/resourceMovementController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// Get all movements for an allocation
router.get(
  "/allocation/:allocationId",
  authenticate,
  getMovements
);


// PLANNED → DISPATCHED
router.post(
  "/:movementId/dispatch",
  authenticate,
  dispatchMovement
);


// DISPATCHED → IN_TRANSIT
router.post(
  "/:movementId/in-transit",
  authenticate,
  markInTransit
);


// IN_TRANSIT → DELIVERED
router.post(
  "/:movementId/deliver",
  authenticate,
  deliverMovement
);

router.get(
  "/:movementId/blockchain",
  authenticate,
  getBlockchainAudits
);


module.exports = router;
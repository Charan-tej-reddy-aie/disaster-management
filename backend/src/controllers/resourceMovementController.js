const {
  updateMovementStatus,
  getAllocationMovements
} = require("../services/resourceMovementService");
const {
  getBlockchainAuditForEntity
} = require("../services/blockchainAuditService");


const getBlockchainAudits = async (req, res) => {
  try {

    const movementId =
      Number(req.params.movementId);

    if (!Number.isInteger(movementId) || movementId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid movement ID"
      });
    }

    const records =
      await getBlockchainAuditForEntity({
        entityType: "RESOURCE_MOVEMENT",
        entityId: movementId
      });

    return res.json({
      success: true,
      movementId,
      blockchainAudits: records
    });

  } catch (error) {

    console.error(
      "Blockchain audit lookup error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const dispatchMovement = async (req, res) => {
  try {

    const movementId = Number(req.params.movementId);

    const allowedRoles = [
      "NATIONAL_HEAD",
      "STATE_HEAD",
      "WAREHOUSE_MANAGER"
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to dispatch resources"
      });
    }

    const result = await updateMovementStatus({
      movementId,
      newStatus: "DISPATCHED",
      userId: req.user.userId,
      userRole: req.user.role
    });

    return res.json(result);

  } catch (error) {

    console.error("Dispatch error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const markInTransit = async (req, res) => {
  try {

    const movementId = Number(req.params.movementId);

    const allowedRoles = [
      "NATIONAL_HEAD",
      "STATE_HEAD",
      "WAREHOUSE_MANAGER",
      "FIELD_OFFICER"
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update movement status"
      });
    }

    const result = await updateMovementStatus({
      movementId,
      newStatus: "IN_TRANSIT",
      userId: req.user.userId,
      userRole: req.user.role
    });

    return res.json(result);

  } catch (error) {

    console.error("In-transit error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const deliverMovement = async (req, res) => {
  try {

    const movementId = Number(req.params.movementId);

    const allowedRoles = [
      "NATIONAL_HEAD",
      "STATE_HEAD",
      "FIELD_OFFICER",
      "WAREHOUSE_MANAGER"
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to confirm delivery"
      });
    }

    const result = await updateMovementStatus({
      movementId,
      newStatus: "DELIVERED",
      userId: req.user.userId,
      userRole: req.user.role
    });

    return res.json(result);

  } catch (error) {

    console.error("Delivery error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getMovements = async (req, res) => {
  try {

    const allocationId = Number(req.params.allocationId);

    const movements =
      await getAllocationMovements(allocationId);

    return res.json({
      success: true,
      allocationId,
      movements
    });

  } catch (error) {

    console.error("Get movements error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  dispatchMovement,
  markInTransit,
  deliverMovement,
  getMovements,
  getBlockchainAudits
};
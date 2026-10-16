const {
  createShortageRequest,
  getAllRequests: getAllResourceRequests,
  getStatePendingRequests,
  getNationalPendingRequests,
  approveByStateHead,
  rejectByStateHead,
  approveByNationalHead,
  rejectByNationalHead
} = require("../services/resourceRequestService");


// ============================================================
// CREATE RESOURCE REQUEST FROM SHORTAGE
// ============================================================

async function createRequestFromShortage(req, res) {
  try {
    const {
      predictionId,
      stateId,
      priority,
      reason
    } = req.body;

    // User ID comes from JWT authentication
    const requestedBy = req.user.userId;

    const result = await createShortageRequest({
      predictionId,
      requestedBy,
      stateId,
      priority,
      reason
    });

    return res.status(201).json({
      success: true,
      message: result.requestCreated
        ? "Resource shortage request created successfully"
        : "No resource shortage exists",
      data: result
    });

  } catch (error) {
    console.error(
      "Resource request creation error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// GET ALL RESOURCE REQUESTS
// Used by:
// - ResourceRequests.jsx
// - QuantumOptimization.jsx
// ============================================================

async function getAllRequests(req, res) {
  try {
    const requests = await getAllResourceRequests();

    return res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error(
      "Get all resource requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// GET STATE HEAD PENDING REQUESTS
// ============================================================

async function getStatePending(req, res) {
  try {
    const stateId = req.user.stateId;

    const requests = await getStatePendingRequests({
      stateId
    });

    return res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error(
      "Get state pending requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// STATE HEAD APPROVE REQUEST
// ============================================================

async function stateApprove(req, res) {
  try {
    const requestId = Number(req.params.id);

    const approvingUserId = req.user.userId;

    const result = await approveByStateHead({
      requestId,
      approvingUserId
    });

    return res.status(200).json({
      success: true,
      message: "Resource request approved by State Head",
      data: result
    });

  } catch (error) {
    console.error(
      "State Head approval error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// STATE HEAD REJECT REQUEST
// ============================================================

async function stateReject(req, res) {
  try {
    const requestId = Number(req.params.id);

    const approvingUserId = req.user.userId;

    const comments =
      req.body.comments ||
      req.body.reason ||
      null;

    const result = await rejectByStateHead({
      requestId,
      approvingUserId,
      comments
    });

    return res.status(200).json({
      success: true,
      message: "Resource request rejected by State Head",
      data: result
    });

  } catch (error) {
    console.error(
      "State Head rejection error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// GET NATIONAL HEAD PENDING REQUESTS
// ============================================================

async function getNationalPending(req, res) {
  try {
    const requests = await getNationalPendingRequests();

    return res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error(
      "Get national pending requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// NATIONAL HEAD APPROVE REQUEST
// ============================================================

async function nationalApprove(req, res) {
  try {
    const requestId = Number(req.params.id);

    const approvingUserId = req.user.userId;

    const result = await approveByNationalHead({
      requestId,
      approvingUserId
    });

    return res.status(200).json({
      success: true,
      message: "Resource request approved by National Head",
      data: result
    });

  } catch (error) {
    console.error(
      "National Head approval error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// NATIONAL HEAD REJECT REQUEST
// ============================================================

async function nationalReject(req, res) {
  try {
    const requestId = Number(req.params.id);

    const approvingUserId = req.user.userId;

    const comments =
      req.body.comments ||
      req.body.reason ||
      null;

    const result = await rejectByNationalHead({
      requestId,
      approvingUserId,
      comments
    });

    return res.status(200).json({
      success: true,
      message: "Resource request rejected by National Head",
      data: result
    });

  } catch (error) {
    console.error(
      "National Head rejection error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
}


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  createRequestFromShortage,

  getAllRequests,

  getStatePending,
  stateApprove,
  stateReject,

  getNationalPending,
  nationalApprove,
  nationalReject
};
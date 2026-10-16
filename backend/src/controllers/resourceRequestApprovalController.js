const {
  getPendingStateRequests,
  approveStateRequest,
  rejectStateRequest
} = require("../services/resourceRequestApprovalService");


// ======================================================
// GET PENDING REQUESTS
// ======================================================

async function getPendingRequests(req, res) {

  try {

    const stateId = req.user.stateId;

    if (!stateId) {

      return res.status(400).json({
        success: false,
        message: "User is not associated with a state"
      });

    }


    const requests =
      await getPendingStateRequests(stateId);


    return res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });


  } catch (error) {

    console.error(
      "Get pending state requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
}



// ======================================================
// STATE HEAD APPROVE
// ======================================================

async function approveRequest(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);

    const actedBy =
      req.user.userId;

    const stateId =
      req.user.stateId;

    const { comments } =
      req.body || {};


    if (!requestId) {

      return res.status(400).json({
        success: false,
        message: "Invalid request ID"
      });

    }


    if (!stateId) {

      return res.status(403).json({
        success: false,
        message: "User is not associated with a state"
      });

    }


    const result =
      await approveStateRequest({
        requestId,
        actedBy,
        stateId,
        comments
      });


    return res.status(200).json({

      success: true,

      message:
        "Resource request approved by State Head",

      result

    });


  } catch (error) {

    console.error(
      "Approve state request error:",
      error
    );

    return res.status(400).json({

      success: false,

      message: error.message

    });

  }
}



// ======================================================
// STATE HEAD REJECT
// ======================================================

async function rejectRequest(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);

    const actedBy =
      req.user.userId;

    const stateId =
      req.user.stateId;

    const { comments } =
      req.body || {};


    if (!requestId) {

      return res.status(400).json({
        success: false,
        message: "Invalid request ID"
      });

    }


    if (!stateId) {

      return res.status(403).json({
        success: false,
        message: "User is not associated with a state"
      });

    }


    const result =
      await rejectStateRequest({
        requestId,
        actedBy,
        stateId,
        comments
      });


    return res.status(200).json({

      success: true,

      message:
        "Resource request rejected by State Head",

      result

    });


  } catch (error) {

    console.error(
      "Reject state request error:",
      error
    );

    return res.status(400).json({

      success: false,

      message: error.message

    });

  }
}



module.exports = {
  getPendingRequests,
  approveRequest,
  rejectRequest
};
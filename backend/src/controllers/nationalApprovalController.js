const {
  getPendingNationalRequests,
  approveNationalRequest,
  rejectNationalRequest
} = require("../services/nationalApprovalService");


// ======================================================
// GET PENDING NATIONAL REQUESTS
// ======================================================

async function getPendingRequests(req, res) {

  try {

    const requests =
      await getPendingNationalRequests();


    return res.status(200).json({

      success: true,

      count: requests.length,

      requests

    });

  } catch (error) {

    console.error(
      "Get pending national requests error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message

    });

  }
}



// ======================================================
// NATIONAL APPROVE
// ======================================================

async function approveRequest(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);

    const actedBy =
      req.user.userId;

    const { comments } =
      req.body || {};


    if (!requestId) {

      return res.status(400).json({

        success: false,

        message: "Invalid request ID"

      });

    }


    const result =
      await approveNationalRequest({

        requestId,

        actedBy,

        comments

      });


    return res.status(200).json({

      success: true,

      message:
        "Resource request approved by National Head",

      result

    });

  } catch (error) {

    console.error(
      "National approval error:",
      error
    );

    return res.status(400).json({

      success: false,

      message: error.message

    });

  }
}



// ======================================================
// NATIONAL REJECT
// ======================================================

async function rejectRequest(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);

    const actedBy =
      req.user.userId;

    const { comments } =
      req.body || {};


    if (!requestId) {

      return res.status(400).json({

        success: false,

        message: "Invalid request ID"

      });

    }


    const result =
      await rejectNationalRequest({

        requestId,

        actedBy,

        comments

      });


    return res.status(200).json({

      success: true,

      message:
        "Resource request rejected by National Head",

      result

    });

  } catch (error) {

    console.error(
      "National rejection error:",
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
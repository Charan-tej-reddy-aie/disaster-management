const {
  createResourceAllocation,
  createQuantumAllocationFromRun
} = require("../services/resourceAllocationService");

const {
  runQuantumAllocationPreview
} = require("../services/quantumAllocationService");


// ======================================================
// CREATE RESOURCE ALLOCATION
// ======================================================

async function createAllocation(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);

    const allocatedBy =
      req.user.userId;


    // --------------------------------------------------
    // Verify National Head
    // --------------------------------------------------

    if (req.user.role !== "NATIONAL_HEAD") {

      return res.status(403).json({
        success: false,
        message:
          "Only the National Head can create a resource allocation"
      });

    }


    if (!Number.isInteger(requestId) || requestId <= 0) {

      return res.status(400).json({
        success: false,
        message: "Invalid request ID"
      });

    }


    const result =
      await createResourceAllocation({
        requestId,
        allocatedBy
      });


    return res.status(201).json({

      success: true,

      message:
        "Resource allocation created successfully",

      result

    });


  } catch (error) {

    console.error(
      "Resource allocation error:",
      error
    );


    return res.status(400).json({

      success: false,

      message: error.message

    });

  }
}


// ======================================================
// RUN QUANTUM OPTIMIZATION
// ======================================================

async function runQuantumOptimization(req, res) {

  try {

    const requestId =
      Number(req.params.requestId);


    // --------------------------------------------------
    // Validate request ID
    // --------------------------------------------------

    if (!Number.isInteger(requestId) || requestId <= 0) {

      return res.status(400).json({
        success: false,
        message: "Invalid resource request ID"
      });

    }


    // --------------------------------------------------
    // Only National Head can run optimization
    // --------------------------------------------------

    if (req.user.role !== "NATIONAL_HEAD") {

      return res.status(403).json({
        success: false,
        message:
          "Only National Head can run quantum optimization"
      });

    }


    // --------------------------------------------------
    // Run quantum optimization
    // --------------------------------------------------

    const result =
      await runQuantumAllocationPreview(requestId);


    return res.status(200).json(result);


  } catch (error) {

    console.error(
      "Quantum optimization error:",
      error
    );


    return res.status(400).json({

      success: false,

      message: error.message

    });

  }
}


// ======================================================
// CREATE FINAL QUANTUM RESOURCE ALLOCATION
// ======================================================

const createQuantumAllocation = async (req, res) => {

  try {

    const requestId =
      Number(req.params.requestId);

    const {
      optimizationRunId
    } = req.body;


    // --------------------------------------------------
    // Validate request ID
    // --------------------------------------------------

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid resource request ID"
      });

    }


    // --------------------------------------------------
    // Validate optimization run ID
    // --------------------------------------------------

    const runId =
      Number(optimizationRunId);


    if (
      !Number.isInteger(runId) ||
      runId <= 0
    ) {

      return res.status(400).json({
        success: false,
        message:
          "optimizationRunId is required and must be valid"
      });

    }


    // --------------------------------------------------
    // Only National Head can create allocation
    // --------------------------------------------------

    if (
      req.user.role !==
      "NATIONAL_HEAD"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Only National Head can create quantum resource allocation"
      });

    }


    // --------------------------------------------------
    // Create allocation from completed run
    // --------------------------------------------------

    const result =
      await createQuantumAllocationFromRun({

        requestId,

        optimizationRunId:
          runId,

        allocatedBy:
          req.user.userId

      });


    return res.status(201).json(result);


  } catch (error) {

    console.error(
      "Quantum allocation error:",
      error.message
    );


    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

  // Existing normal allocation
  createResourceAllocation:
    createAllocation,

  // Quantum optimization
  runQuantumOptimization,

  // Final quantum allocation
  createQuantumAllocation

};
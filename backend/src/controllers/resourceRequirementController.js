const {
  calculateResourceRequirements,
  generateResourceRequirements
} = require("../services/resourceRequirementService");


// ==========================================================
// GET RESOURCE REQUIREMENTS
// ==========================================================

const getResourceRequirements = async (req, res) => {

  try {

    const predictionId =
      Number(req.params.predictionId);


    if (
      !Number.isInteger(predictionId) ||
      predictionId <= 0
    ) {

      return res.status(400).json({
        success: false,
        message: "Invalid prediction ID"
      });

    }


    const result =
      await calculateResourceRequirements(
        predictionId
      );


    return res.json({

      success: true,

      data: result

    });


  } catch (error) {

    console.error(
      "Resource requirement error:",
      error
    );


    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// ==========================================================
// GENERATE AND SAVE RESOURCE REQUIREMENTS
// ==========================================================

const generateRequirements = async (req, res) => {

  try {

    const predictionId =
      Number(req.params.predictionId);


    if (
      !Number.isInteger(predictionId) ||
      predictionId <= 0
    ) {

      return res.status(400).json({

        success: false,

        message: "Invalid prediction ID"

      });

    }


    const result =
      await generateResourceRequirements(
        predictionId
      );


    return res.status(201).json({

      success: result.success,

      message:
        result.message,

      data: {

        prediction:
          result.prediction,

        requirements:
          result.requirements

      }

    });


  } catch (error) {

    console.error(
      "Generate resource requirements error:",
      error
    );


    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {

  getResourceRequirements,

  generateRequirements

};
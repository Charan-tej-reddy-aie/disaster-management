const {
  getAllResources,
  getResourceSummary
} = require("../services/resourceService");

async function getResources(req, res) {
  try {
    const resources = await getAllResources();

    return res.json({
      success: true,
      data: resources
    });

  } catch (error) {
    console.error("Get resources error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

async function getSummary(req, res) {
  try {
    const resources = await getResourceSummary();

    return res.json({
      success: true,
      data: resources
    });

  } catch (error) {
    console.error("Get resource summary error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  getResources,
  getSummary
};
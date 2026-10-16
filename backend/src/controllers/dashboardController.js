const {
  getDashboardData,
  getDashboardPredictions,
  getDashboardStats,
} = require("../services/dashboardService");


const getDashboard = async (req, res) => {

  try {

    const data = await getDashboardData();

    return res.json({
      success: true,
      data,
    });

  } catch (error) {

    console.error(
      "Dashboard data error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


const getPredictions = async (req, res) => {

  try {

    const predictions =
      await getDashboardPredictions();

    return res.json({
      success: true,
      predictions,
    });

  } catch (error) {

    console.error(
      "Dashboard predictions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


const getStats = async (req, res) => {

  try {

    const stats =
      await getDashboardStats();

    return res.json({
      success: true,
      stats,
    });

  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


module.exports = {
  getDashboard,
  getPredictions,
  getStats,
};
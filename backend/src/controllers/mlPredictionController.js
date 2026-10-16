const {
    predictDisaster,
    checkMLService
} = require("../services/mlPredictionService");


async function health(req, res) {

    try {

        const result = await checkMLService();

        return res.json({
            success: true,
            ml_service: result
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function predict(req, res) {

    try {

        const result = await predictDisaster(
            req.body
        );

        return res.json(result);

    } catch (error) {

        return res.status(503).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    health,
    predict
};
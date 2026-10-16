const {
    runLivePrediction
} = require("../services/livePredictionService");


async function runPrediction(req, res) {

    try {

        const {
            latitude,
            longitude,
            stateId,
            districtId
        } = req.body;


        if (
            latitude === undefined ||
            longitude === undefined ||
            stateId === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "latitude, longitude and stateId are required"
            });

        }


        const result =
            await runLivePrediction({
                latitude,
                longitude,
                stateId,
                districtId
            });


        return res.status(201).json(
            result
        );


    } catch (error) {

        console.error(
            "Live prediction error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}


module.exports = {
    runPrediction
};
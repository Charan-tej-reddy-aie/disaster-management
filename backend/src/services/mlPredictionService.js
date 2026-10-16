const axios = require("axios");

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";


async function predictDisaster(weatherData) {

    try {

        const response = await axios.post(
            `${ML_SERVICE_URL}/predict`,
            weatherData,
            {
                timeout: 30000
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "ML prediction service error:",
            error.response?.data || error.message
        );

        throw new Error(
            "ML prediction service is unavailable"
        );
    }
}


async function checkMLService() {

    try {

        const response = await axios.get(
            `${ML_SERVICE_URL}/health`,
            {
                timeout: 5000
            }
        );

        return response.data;

    } catch (error) {

        return {
            status: "UNAVAILABLE",
            error: error.message
        };
    }
}


module.exports = {
    predictDisaster,
    checkMLService
};
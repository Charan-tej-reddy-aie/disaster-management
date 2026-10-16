const axios = require("axios");

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Get current weather data from Open-Meteo
 */
async function getCurrentWeather(latitude, longitude) {
    try {
        const response = await axios.get(WEATHER_API_URL, {
            params: {
                latitude,
                longitude,

                current: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "surface_pressure"
                ].join(","),

                timezone: "UTC"
            },

            timeout: 30000
        });

        const current = response.data.current;

        return {
            observationTime: current.time,

            temperature: current.temperature_2m,

            humidity: current.relative_humidity_2m,

            rainfall: current.precipitation,

            windSpeed: current.wind_speed_10m,

            windDirection: current.wind_direction_10m,

            pressure: current.surface_pressure,

            latitude,
            longitude,

            provider: "Open-Meteo",

            rawData: response.data
        };

    } catch (error) {

        console.error(
            "Open-Meteo API error:",
            error.response?.data || error.message
        );

        throw new Error(
            "Unable to retrieve weather data"
        );
    }
}
async function getHistoricalWeather(
    latitude,
    longitude,
    startDate,
    endDate
) {
    try {

        const response = await axios.get(
            "https://archive-api.open-meteo.com/v1/archive",
            {
                params: {
                    latitude,
                    longitude,

                    start_date: startDate,
                    end_date: endDate,

                    daily: [
                        "temperature_2m_mean",
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_sum",
                        "relative_humidity_2m_mean",
                        "surface_pressure_mean",
                        "wind_speed_10m_mean",
                        "wind_speed_10m_max",
                        "wind_direction_10m_dominant"
                    ].join(","),

                    timezone: "UTC"
                },

                timeout: 30000
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "Open-Meteo historical API error:",
            error.response?.data || error.message
        );

        throw new Error(
            "Unable to retrieve historical weather data"
        );
    }
}

module.exports = {
    getCurrentWeather,
    getHistoricalWeather
};
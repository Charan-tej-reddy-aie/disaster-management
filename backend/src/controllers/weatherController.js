const weatherService = require("../services/weatherService");
const pool = require("../config/database");

async function ingestWeather(req, res) {

    try {

        const { districtId, latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "latitude and longitude are required"
            });
        }

        const weather =
            await weatherService.getCurrentWeather(
                Number(latitude),
                Number(longitude)
            );

        /*
         * Convert ISO timestamp to MySQL DATETIME
         *
         * Example:
         * 2026-09-08T17:15 -> 2026-09-08 17:15:00
         */
        const observationTime =
            new Date(weather.observationTime)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ");

        const metadata = {
            provider: weather.provider,
            latitude: weather.latitude,
            longitude: weather.longitude,
            rawData: weather.rawData
        };

        const sql = `
            INSERT INTO weather_observations
            (
                district_id,
                observation_time,
                latitude,
                longitude,
                temperature,
                rainfall,
                humidity,
                wind_speed,
                wind_direction,
                pressure,
                provider_name,
                metadata
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            districtId ? Number(districtId) : null,
            observationTime,
            weather.latitude,
            weather.longitude,
            weather.temperature,
            weather.rainfall,
            weather.humidity,
            weather.windSpeed,
            weather.windDirection,
            weather.pressure,
            weather.provider,
            JSON.stringify(metadata)
        ];

        const [result] = await pool.execute(
            sql,
            values
        );

        res.status(201).json({
            success: true,
            message: "Weather observation stored successfully",

            weatherObservationId:
                result.insertId,

            data: {
                weatherObservationId:
                    result.insertId,

                districtId:
                    districtId ? Number(districtId) : null,

                observationTime,

                latitude:
                    weather.latitude,

                longitude:
                    weather.longitude,

                temperature:
                    weather.temperature,

                rainfall:
                    weather.rainfall,

                humidity:
                    weather.humidity,

                windSpeed:
                    weather.windSpeed,

                windDirection:
                    weather.windDirection,

                pressure:
                    weather.pressure,

                provider:
                    weather.provider
            }
        });

    } catch (error) {

        console.error(
            "Weather ingestion error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    ingestWeather
};
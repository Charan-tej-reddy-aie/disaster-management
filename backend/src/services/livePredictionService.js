const axios = require("axios");
const pool = require("../config/database");

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://127.0.0.1:8001";


// ============================================================
// DISASTER TYPE MAPPING
// ============================================================

const DISASTER_TYPE_MAP = {
    FLOOD: 1,
    CYCLONE: 2,
    EARTHQUAKE: 3,
    LANDSLIDE: 4,
    WILDFIRE: 5,
    DROUGHT: 6,
    TSUNAMI: 7
};


// ============================================================
// FETCH 14 DAYS WEATHER
// ============================================================

async function fetchWeatherHistory(latitude, longitude) {

    const endDate = new Date();

    const startDate = new Date();
    startDate.setUTCDate(
        startDate.getUTCDate() - 13
    );

    const formatDate = (date) =>
        date.toISOString().slice(0, 10);

    const response = await axios.get(
        "https://archive-api.open-meteo.com/v1/archive",
        {
            params: {
                latitude,
                longitude,

                start_date: formatDate(startDate),
                end_date: formatDate(endDate),

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

            timeout: 60000
        }
    );

    return response.data;
}


// ============================================================
// BUILD MODEL FEATURES
// ============================================================

function buildFeatures(weather) {

    const daily = weather.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
        throw new Error(
            "No historical weather data returned"
        );
    }

    const last = daily.time.length - 1;

    const get = (array, index = last) =>
        Number(array?.[index] ?? 0);

    const precipitation =
        daily.precipitation_sum || [];

    const humidity =
        daily.relative_humidity_2m_mean || [];

    const temperature =
        daily.temperature_2m_mean || [];

    const wind =
        daily.wind_speed_10m_mean || [];

    const windMax =
        daily.wind_speed_10m_max || [];

    const pressure =
        daily.surface_pressure_mean || [];


    const sumWindow = (array, window) => {

        const start =
            Math.max(0, array.length - window);

        return array
            .slice(start)
            .reduce(
                (sum, value) =>
                    sum + Number(value || 0),
                0
            );
    };


    const meanWindow = (array, window) => {

        const start =
            Math.max(0, array.length - window);

        const values =
            array
                .slice(start)
                .map(Number)
                .filter(Number.isFinite);

        if (!values.length) {
            return 0;
        }

        return (
            values.reduce(
                (sum, value) => sum + value,
                0
            ) / values.length
        );
    };


    const maxWindow = (array, window) => {

        const start =
            Math.max(0, array.length - window);

        const values =
            array
                .slice(start)
                .map(Number)
                .filter(Number.isFinite);

        return values.length
            ? Math.max(...values)
            : 0;
    };


    const currentTemperature =
        get(daily.temperature_2m_mean);

    const currentTemperatureMax =
        get(daily.temperature_2m_max);

    const currentTemperatureMin =
        get(daily.temperature_2m_min);


    const currentPrecipitation =
        get(precipitation);


    const currentHumidity =
        get(humidity);


    const currentPressure =
        get(pressure);


    const previousPressure =
        pressure.length >= 2
            ? Number(pressure[pressure.length - 2] || 0)
            : currentPressure;


    const pressure3DaysAgo =
        pressure.length >= 4
            ? Number(pressure[pressure.length - 4] || 0)
            : currentPressure;


    return {

        temperature_2m_mean:
            currentTemperature,

        temperature_2m_max:
            currentTemperatureMax,

        temperature_2m_min:
            currentTemperatureMin,

        temperature_range:
            currentTemperatureMax -
            currentTemperatureMin,


        precipitation_sum:
            currentPrecipitation,


        rainfall_1d:
            currentPrecipitation,

        rainfall_3d:
            sumWindow(
                precipitation,
                3
            ),

        rainfall_7d:
            sumWindow(
                precipitation,
                7
            ),

        rainfall_14d:
            sumWindow(
                precipitation,
                14
            ),


        rainfall_3d_mean:
            meanWindow(
                precipitation,
                3
            ),

        rainfall_7d_mean:
            meanWindow(
                precipitation,
                7
            ),


        relative_humidity_2m_mean:
            currentHumidity,

        humidity_3d_mean:
            meanWindow(
                humidity,
                3
            ),

        humidity_7d_mean:
            meanWindow(
                humidity,
                7
            ),


        surface_pressure_mean:
            currentPressure,

        pressure_change_1d:
            currentPressure -
            previousPressure,

        pressure_change_3d:
            currentPressure -
            pressure3DaysAgo,


        wind_speed_10m_mean:
            get(
                daily.wind_speed_10m_mean
            ),

        wind_speed_10m_max:
            get(
                daily.wind_speed_10m_max
            ),

        wind_3d_mean:
            meanWindow(
                wind,
                3
            ),

        wind_7d_mean:
            meanWindow(
                wind,
                7
            ),

        wind_max_7d:
            maxWindow(
                windMax,
                7
            ),

        wind_direction_10m_dominant:
            get(
                daily.wind_direction_10m_dominant
            )
    };
}


// ============================================================
// ESTIMATE AFFECTED POPULATION
// ============================================================

function estimateAffectedPopulation(
    probability,
    severity
) {

    const basePopulation = {
        LOW: 5000,
        MEDIUM: 10000,
        HIGH: 25000,
        CRITICAL: 50000
    };

    const base =
        basePopulation[severity] || 5000;

    return Math.round(
        base * probability
    );
}


// ============================================================
// FIND STATE
// ============================================================

async function getState(stateId) {

    const [rows] = await pool.query(
        `
        SELECT
            state_id,
            state_name
        FROM states
        WHERE state_id = ?
        `,
        [stateId]
    );

    if (!rows.length) {
        throw new Error(
            "State not found"
        );
    }

    return rows[0];
}


// ============================================================
// CREATE / UPDATE PREDICTION
// ============================================================

async function runLivePrediction({
    latitude,
    longitude,
    stateId,
    districtId = null
}) {

    latitude = Number(latitude);
    longitude = Number(longitude);
    stateId = Number(stateId);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {
        throw new Error(
            "Valid latitude and longitude are required"
        );
    }

    if (!Number.isInteger(stateId)) {
        throw new Error(
            "Valid stateId is required"
        );
    }


    // --------------------------------------------------------
    // 1. State
    // --------------------------------------------------------

    const state =
        await getState(stateId);


    // --------------------------------------------------------
    // 2. Weather
    // --------------------------------------------------------

    const weather =
        await fetchWeatherHistory(
            latitude,
            longitude
        );


    // --------------------------------------------------------
    // 3. Features
    // --------------------------------------------------------

    const features =
        buildFeatures(weather);


    // --------------------------------------------------------
    // 4. ML prediction
    // --------------------------------------------------------

    const mlResponse =
        await axios.post(
            `${ML_SERVICE_URL}/predict`,
            features,
            {
                timeout: 30000
            }
        );


    const prediction =
        mlResponse.data;


    if (!prediction.success) {
        throw new Error(
            "ML prediction failed"
        );
    }


    // --------------------------------------------------------
    // 5. Disaster type
    // --------------------------------------------------------

    const predictedDisaster =
        String(
            prediction.predicted_disaster
        ).toUpperCase();


    // ============================================================
// NORMAL = NO DISASTER DETECTED
// ============================================================


if (predictedDisaster === "NORMAL") {
    const probabilityPercent =
        Number(prediction.probability) * 100;

    const [savedRun] = await pool.query(
        `
        INSERT INTO prediction_runs (
            state_id,
            prediction_model_id,
            latitude,
            longitude,
            predicted_class,
            probability_percent,
            severity,
            class_probabilities,
            weather_features
        )
        VALUES (?, 1, ?, ?, ?, ?, 'LOW', ?, ?)
        `,
        [
            state.state_id,
            latitude,
            longitude,
            "NORMAL",
            probabilityPercent,
            JSON.stringify(
                prediction.class_probabilities ?? {}
            ),
            JSON.stringify(features)
        ]
    );

    return {
        success: true,
        disasterDetected: false,
        message:
            "No disaster was classified by the model. The result was saved.",

        runId: savedRun.insertId,

        state: {
            stateId: state.state_id,
            stateName: state.state_name
        },

        location: {
            latitude,
            longitude
        },

        prediction: {
            disaster: "NORMAL",
            probability: prediction.probability,
            probabilityPercent,
            severity: "LOW",
            confidence: prediction.probability,
            classProbabilities:
                prediction.class_probabilities ?? {}
        },

        affectedPopulation: 0,

        resourceRequirements: {
            success: true,
            requirements: [],
            message:
                "No resources generated for this NORMAL classification."
        },

        weatherFeatures: features
    };
}



// ============================================================
// ACTUAL DISASTER
// ============================================================

const disasterTypeId =
    DISASTER_TYPE_MAP[
        predictedDisaster
    ];


if (!disasterTypeId) {

    throw new Error(
        `Unsupported disaster type: ${predictedDisaster}`
    );

}


    // --------------------------------------------------------
    // 6. Affected population
    // --------------------------------------------------------

    const affectedPopulation =
        estimateAffectedPopulation(
            prediction.probability,
            prediction.severity
        );


    // --------------------------------------------------------
    // 7. Database transaction
    // --------------------------------------------------------

    const connection =
        await pool.getConnection();


    try {

        await connection.beginTransaction();


        // ----------------------------------------------------
        // Disaster event
        // ----------------------------------------------------

        const eventName =
            `${predictedDisaster} Prediction - ${state.state_name}`;


        const [eventResult] =
            await connection.query(
                `
                INSERT INTO disaster_events
                (
                    disaster_type_id,
                    state_id,
                    district_id,
                    event_name,
                    event_status
                )
                VALUES (?, ?, ?, ?, 'PREDICTED')
                `,
                [
                    disasterTypeId,
                    stateId,
                    districtId,
                    eventName
                ]
            );


        const disasterEventId =
            eventResult.insertId;


        // ----------------------------------------------------
        // Prediction
        // ----------------------------------------------------

        const predictionTime =
            new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " ");


        const [predictionResult] =
            await connection.query(
                `
                INSERT INTO disaster_predictions
                (
                    disaster_event_id,
                    prediction_model_id,
                    prediction_time,
                    probability,
                    severity,
                    expected_start_time,
                    expected_end_time,
                    affected_area_km2,
                    affected_population,
                    confidence_score,
                    prediction_details
                )
                VALUES
                (
                    ?,
                    1,
                    ?,
                    ?,
                    ?,
                    NULL,
                    NULL,
                    NULL,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    disasterEventId,
                    predictionTime,
                    prediction.probability * 100,
                    prediction.severity,
                    affectedPopulation,
                    prediction.probability * 100,
                    JSON.stringify({
                        source: "LIVE_WEATHER_ML",
                        latitude,
                        longitude,
                        stateId,
                        districtId,
                        predictedDisaster,
                        classProbabilities:
                            prediction.class_probabilities,
                        weatherFeatures:
                            features
                    })
                ]
            );


        const predictionId =
            predictionResult.insertId;

        
        // ----------------------------------------------------
        // Save the same result in prediction_runs
        // ----------------------------------------------------

        const probabilityPercent =
            Number(prediction.probability) * 100;

        const [runResult] = await connection.query(
            `
            INSERT INTO prediction_runs (
                state_id,
                prediction_model_id,
                latitude,
                longitude,
                predicted_class,
                probability_percent,
                severity,
                class_probabilities,
                weather_features
            )
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                state.state_id,
                latitude,
                longitude,
                predictedDisaster,
                probabilityPercent,
                prediction.severity,
                JSON.stringify(
                    prediction.class_probabilities ?? {}
                ),
                JSON.stringify(features)
            ]
        );

        const runId = runResult.insertId;



        // ----------------------------------------------------
        // Prediction area
        // ----------------------------------------------------

        if (districtId) {

            await connection.query(
                `
                INSERT INTO prediction_areas
                (
                    prediction_id,
                    district_id,
                    risk_level,
                    population_at_risk
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    predictionId,
                    districtId,
                    prediction.severity,
                    affectedPopulation
                ]
            );

        }


        await connection.commit();


        // ----------------------------------------------------
        // Resource requirements
        // ----------------------------------------------------

        const {
            generateResourceRequirements
        } = require(
            "./resourceRequirementService"
        );


        let resourceRequirements = null;


        try {

            resourceRequirements =
                await generateResourceRequirements(
                    predictionId
                );

        } catch (resourceError) {

            console.error(
                "Resource requirement generation failed:",
                resourceError.message
            );

            resourceRequirements = {
                success: false,
                message:
                    resourceError.message
            };
        }


        
return {
    success: true,

    runId,
    predictionId,
    disasterEventId,


            state: {
                stateId:
                    state.state_id,

                stateName:
                    state.state_name
            },

            location: {
                latitude,
                longitude
            },

            prediction: {
                disaster:
                    predictedDisaster,

                probability:
                    prediction.probability,

                severity:
                    prediction.severity,

                confidence:
                    prediction.probability,

                classProbabilities:
                    prediction.class_probabilities
            },

            affectedPopulation,

            resourceRequirements,

            weatherFeatures:
                features
        };


    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
}


module.exports = {
    runLivePrediction
};
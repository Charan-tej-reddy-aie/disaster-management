USE disaster_management;

DESCRIBE resource_requirement_rules;
DESCRIBE predicted_resource_requirements;
DESCRIBE resources;
DESCRIBE warehouse_resources;
DESCRIBE resource_requests;
DESCRIBE resource_request_items;

SELECT * FROM resource_requirement_rules LIMIT 10;

SELECT * FROM resources LIMIT 10;

SELECT * FROM warehouse_resources LIMIT 10;



DESCRIBE resource_requirement_rules;

SELECT * 
FROM resource_requirement_rules;

SELECT *
FROM disaster_predictions
ORDER BY prediction_id DESC
LIMIT 5;

SELECT COUNT(*) AS total_predictions
FROM disaster_predictions;

DESCRIBE disaster_predictions;

SELECT *
FROM prediction_models;


SELECT *
FROM disaster_events
LIMIT 10;


SELECT *
FROM satellite_observations
ORDER BY observationDateTime DESC
LIMIT 5;


SELECT *
FROM weather_observations
ORDER BY observation_time DESC
LIMIT 5;


DESCRIBE disaster_events;


SELECT
    disaster_type_id,
    disaster_name
FROM disaster_types;


SELECT
    state_id,
    state_name
FROM states
WHERE state_name = 'Kerala';


USE disaster_management;

INSERT INTO disaster_events
(
    disaster_type_id,
    state_id,
    district_id,
    event_name,
    event_status
)
VALUES
(
    1,
    1,
    NULL,
    'Test Kerala Flood - Resource Engine',
    'PREDICTED'
);


SELECT *
FROM disaster_events
ORDER BY disaster_event_id DESC
LIMIT 1;


INSERT INTO disaster_predictions
(
    disaster_event_id,
    prediction_model_id,
    satellite_observation_id,
    weather_observation_id,
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
    1,
    1,
    1,
    1,
    NOW(),
    0.87,
    'HIGH',
    DATE_ADD(NOW(), INTERVAL 6 HOUR),
    DATE_ADD(NOW(), INTERVAL 30 HOUR),
    250.000,
    25000,
    0.82,
    JSON_OBJECT(
        'test_prediction', true,
        'source', 'manual_test',
        'disaster', 'FLOOD',
        'note', 'Controlled test for resource requirement engine'
    )
);


SELECT
    prediction_id,
    disaster_event_id,
    prediction_model_id,
    satellite_observation_id,
    weather_observation_id,
    prediction_time,
    probability,
    severity,
    affected_population,
    confidence_score,
    prediction_details
FROM disaster_predictions
ORDER BY prediction_id DESC
LIMIT 1;	
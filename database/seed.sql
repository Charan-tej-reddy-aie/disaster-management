USE disaster_management;

-- =========================================================
-- COUNTRY
-- =========================================================

INSERT INTO countries (country_name, country_code)
VALUES ('India', 'IN');

-- =========================================================
-- ROLES
-- =========================================================

INSERT INTO roles (role_name, description)
VALUES
('NATIONAL_HEAD', 'Single national-level disaster management head'),
('STATE_HEAD', 'Head responsible for a state'),
('DEPARTMENT_HEAD', 'Head of a disaster/resource department'),
('WAREHOUSE_MANAGER', 'Manages government resource warehouse'),
('FIELD_OFFICER', 'Field-level disaster response officer');

-- =========================================================
-- STATES
-- =========================================================

INSERT INTO states (country_id, state_name, state_code)
SELECT country_id, 'Kerala', 'KL'
FROM countries
WHERE country_code = 'IN';

INSERT INTO states (country_id, state_name, state_code)
SELECT country_id, 'Tamil Nadu', 'TN'
FROM countries
WHERE country_code = 'IN';

INSERT INTO states (country_id, state_name, state_code)
SELECT country_id, 'Karnataka', 'KA'
FROM countries
WHERE country_code = 'IN';

-- =========================================================
-- DISASTER TYPES
-- =========================================================

INSERT INTO disaster_types (disaster_name, description)
VALUES
('FLOOD', 'Flooding caused by excessive rainfall, rivers or other water events'),
('CYCLONE', 'Tropical cyclone and associated severe weather'),
('EARTHQUAKE', 'Seismic event causing ground movement and possible damage'),
('LANDSLIDE', 'Movement of soil, rock or debris down a slope'),
('WILDFIRE', 'Uncontrolled fire affecting vegetation and land'),
('DROUGHT', 'Extended period of unusually low precipitation'),
('TSUNAMI', 'Large sea waves caused by underwater disturbance');

-- =========================================================
-- RESOURCE CATEGORIES
-- =========================================================

INSERT INTO resource_categories (category_name, description)
VALUES
('FOOD', 'Food and emergency ration resources'),
('WATER', 'Drinking and water supply resources'),
('MEDICAL', 'Medical and healthcare resources'),
('RESCUE', 'Search and rescue resources'),
('SHELTER', 'Temporary shelter resources'),
('TRANSPORT', 'Transportation resources'),
('FIRE_RESPONSE', 'Fire fighting resources'),
('COMMUNICATION', 'Emergency communication resources'),
('POWER', 'Emergency power resources');

-- =========================================================
-- RESOURCES
-- =========================================================

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Food Kit', 'KIT',
       'Emergency food supply kit'
FROM resource_categories
WHERE category_name = 'FOOD';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Drinking Water', 'LITRE',
       'Emergency drinking water'
FROM resource_categories
WHERE category_name = 'WATER';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Medical Kit', 'KIT',
       'Emergency medical kit'
FROM resource_categories
WHERE category_name = 'MEDICAL';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Rescue Boat', 'UNIT',
       'Emergency rescue boat'
FROM resource_categories
WHERE category_name = 'RESCUE';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Emergency Shelter', 'UNIT',
       'Temporary emergency shelter'
FROM resource_categories
WHERE category_name = 'SHELTER';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Fire Truck', 'UNIT',
       'Fire response vehicle'
FROM resource_categories
WHERE category_name = 'FIRE_RESPONSE';

INSERT INTO resources
(resource_category_id, resource_name, unit, description)
SELECT resource_category_id, 'Emergency Generator', 'UNIT',
       'Portable emergency power generator'
FROM resource_categories
WHERE category_name = 'POWER';

-- =========================================================
-- SATELLITE SOURCES
-- =========================================================

INSERT INTO satellite_sources
(source_name, provider_name, api_name, description)
VALUES
(
    'Sentinel-1',
    'Copernicus / ESA',
    'Sentinel Hub',
    'Synthetic aperture radar Earth observation data'
),
(
    'Sentinel-2',
    'Copernicus / ESA',
    'Sentinel Hub',
    'Multispectral Earth observation data'
);

-- =========================================================
-- PREDICTION MODELS
-- =========================================================

INSERT INTO prediction_models
(model_name, model_version, model_type, description)
VALUES
(
    'Disaster Prediction Model',
    '1.0',
    'MACHINE_LEARNING',
    'Initial disaster prediction model'
);

-- =========================================================
-- RESOURCE REQUIREMENT RULES
-- =========================================================

-- Example flood rules

INSERT INTO resource_requirement_rules
(disaster_type_id, resource_id, severity,
 quantity_per_person, fixed_quantity, description)

SELECT
    dt.disaster_type_id,
    r.resource_id,
    'HIGH',
    1.0,
    NULL,
    'One food kit per affected person'
FROM disaster_types dt
JOIN resources r
    ON r.resource_name = 'Food Kit'
WHERE dt.disaster_name = 'FLOOD';

INSERT INTO resource_requirement_rules
(disaster_type_id, resource_id, severity,
 quantity_per_person, fixed_quantity, description)

SELECT
    dt.disaster_type_id,
    r.resource_id,
    'HIGH',
    2.0,
    NULL,
    'Two litres of drinking water per affected person'
FROM disaster_types dt
JOIN resources r
    ON r.resource_name = 'Drinking Water'
WHERE dt.disaster_name = 'FLOOD';

INSERT INTO resource_requirement_rules
(disaster_type_id, resource_id, severity,
 quantity_per_person, fixed_quantity, description)

SELECT
    dt.disaster_type_id,
    r.resource_id,
    'HIGH',
    0.10,
    NULL,
    'Medical kits based on affected population'
FROM disaster_types dt
JOIN resources r
    ON r.resource_name = 'Medical Kit'
WHERE dt.disaster_name = 'FLOOD';




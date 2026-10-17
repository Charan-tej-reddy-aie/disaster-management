CREATE DATABASE IF NOT EXISTS disaster_management
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE disaster_management;

-- =========================================================
-- 1. LOCATION / GOVERNMENT HIERARCHY
-- =========================================================

CREATE TABLE countries (
    country_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    country_code CHAR(2) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE states (
    state_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_id BIGINT UNSIGNED NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_state_country
        UNIQUE (country_id, state_name),

    CONSTRAINT uq_state_code
        UNIQUE (country_id, state_code),

    CONSTRAINT fk_states_country
        FOREIGN KEY (country_id)
        REFERENCES countries(country_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE districts (
    district_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    state_id BIGINT UNSIGNED NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_district_state
        UNIQUE (state_id, district_name),

    CONSTRAINT fk_districts_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 2. USER / ROLE MANAGEMENT
-- =========================================================

CREATE TABLE roles (
    role_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    state_id BIGINT UNSIGNED NULL,
    district_id BIGINT UNSIGNED NULL,

    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_users_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 3. DEPARTMENTS
-- =========================================================

CREATE TABLE departments (
    department_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    state_id BIGINT UNSIGNED NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    department_code VARCHAR(50) NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_department_state
        UNIQUE (state_id, department_name),

    CONSTRAINT uq_department_code
        UNIQUE (state_id, department_code),

    CONSTRAINT fk_departments_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 4. DISASTER TYPES
-- =========================================================

CREATE TABLE disaster_types (
    disaster_type_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    disaster_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 5. RESOURCE CATEGORIES / RESOURCES
-- =========================================================

CREATE TABLE resource_categories (
    resource_category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE resources (
    resource_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resource_category_id BIGINT UNSIGNED NOT NULL,
    resource_name VARCHAR(150) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resources_category
        FOREIGN KEY (resource_category_id)
        REFERENCES resource_categories(resource_category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 6. WAREHOUSES
-- =========================================================

CREATE TABLE warehouses (
    warehouse_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    state_id BIGINT UNSIGNED NOT NULL,
    district_id BIGINT UNSIGNED NULL,
    department_id BIGINT UNSIGNED NULL,

    warehouse_name VARCHAR(150) NOT NULL,

    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,

    address TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_warehouses_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_warehouses_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_warehouses_department
        FOREIGN KEY (department_id)
        REFERENCES departments(department_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 7. WAREHOUSE INVENTORY
-- =========================================================

CREATE TABLE warehouse_resources (
    warehouse_resource_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    warehouse_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,

    quantity_available DECIMAL(15,3) NOT NULL DEFAULT 0,
    quantity_reserved DECIMAL(15,3) NOT NULL DEFAULT 0,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_warehouse_resource
        UNIQUE (warehouse_id, resource_id),

    CONSTRAINT chk_quantity_available
        CHECK (quantity_available >= 0),

    CONSTRAINT chk_quantity_reserved
        CHECK (quantity_reserved >= 0),

    CONSTRAINT fk_warehouse_resources_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(warehouse_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_warehouse_resources_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 8. SATELLITE DATA SOURCES
-- =========================================================

CREATE TABLE satellite_sources (
    satellite_source_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    source_name VARCHAR(150) NOT NULL UNIQUE,
    provider_name VARCHAR(150),
    api_name VARCHAR(150),
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 9. SATELLITE OBSERVATIONS
-- =========================================================

CREATE TABLE satellite_observations (
    observation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    satellite_source_id BIGINT UNSIGNED NOT NULL,

    observation_time DATETIME NOT NULL,

    min_latitude DECIMAL(10,7) NOT NULL,
    max_latitude DECIMAL(10,7) NOT NULL,
    min_longitude DECIMAL(10,7) NOT NULL,
    max_longitude DECIMAL(10,7) NOT NULL,

    image_url TEXT,
    data_url TEXT,

    cloud_coverage DECIMAL(5,2) NULL,

    metadata JSON NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_satellite_observations_source
        FOREIGN KEY (satellite_source_id)
        REFERENCES satellite_sources(satellite_source_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 10. WEATHER OBSERVATIONS
-- =========================================================

CREATE TABLE weather_observations (
    weather_observation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    district_id BIGINT UNSIGNED NULL,

    observation_time DATETIME NOT NULL,

    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    temperature DECIMAL(6,2),
    rainfall DECIMAL(10,2),
    humidity DECIMAL(6,2),
    wind_speed DECIMAL(8,2),
    wind_direction DECIMAL(6,2),
    pressure DECIMAL(8,2),

    provider_name VARCHAR(150),

    metadata JSON NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_weather_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================================================
-- 11. DISASTER EVENTS
-- =========================================================

CREATE TABLE disaster_events (
    disaster_event_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    disaster_type_id BIGINT UNSIGNED NOT NULL,
    state_id BIGINT UNSIGNED NOT NULL,
    district_id BIGINT UNSIGNED NULL,

    event_name VARCHAR(200) NOT NULL,

    event_status ENUM(
        'PREDICTED',
        'WARNING',
        'ACTIVE',
        'RESOLVED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PREDICTED',

    actual_start_time DATETIME NULL,
    actual_end_time DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_disaster_events_type
        FOREIGN KEY (disaster_type_id)
        REFERENCES disaster_types(disaster_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_disaster_events_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_disaster_events_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 12. AI / ML MODELS
-- =========================================================

CREATE TABLE prediction_models (
    prediction_model_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    model_name VARCHAR(150) NOT NULL,
    model_version VARCHAR(50) NOT NULL,

    model_type VARCHAR(100),
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_model_version
        UNIQUE (model_name, model_version)
);

-- =========================================================
-- 13. DISASTER PREDICTIONS
-- =========================================================

CREATE TABLE disaster_predictions (
    prediction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    disaster_event_id BIGINT UNSIGNED NOT NULL,
    prediction_model_id BIGINT UNSIGNED NOT NULL,
    satellite_observation_id BIGINT UNSIGNED NULL,
    weather_observation_id BIGINT UNSIGNED NULL,

    prediction_time DATETIME NOT NULL,

    probability DECIMAL(5,2) NOT NULL,

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    expected_start_time DATETIME NULL,
    expected_end_time DATETIME NULL,

    affected_area_km2 DECIMAL(15,3) NULL,
    affected_population BIGINT UNSIGNED NULL,

    confidence_score DECIMAL(5,2) NULL,

    prediction_details JSON NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_prediction_probability
        CHECK (probability >= 0 AND probability <= 100),

    CONSTRAINT chk_prediction_confidence
        CHECK (
            confidence_score IS NULL
            OR (confidence_score >= 0 AND confidence_score <= 100)
        ),

    CONSTRAINT fk_predictions_event
        FOREIGN KEY (disaster_event_id)
        REFERENCES disaster_events(disaster_event_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_predictions_model
        FOREIGN KEY (prediction_model_id)
        REFERENCES prediction_models(prediction_model_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_predictions_satellite
        FOREIGN KEY (satellite_observation_id)
        REFERENCES satellite_observations(observation_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_predictions_weather
        FOREIGN KEY (weather_observation_id)
        REFERENCES weather_observations(weather_observation_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================================================
-- 14. PREDICTION AREAS
-- =========================================================

CREATE TABLE prediction_areas (
    prediction_area_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    prediction_id BIGINT UNSIGNED NOT NULL,
    district_id BIGINT UNSIGNED NOT NULL,

    risk_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    population_at_risk BIGINT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_prediction_district
        UNIQUE (prediction_id, district_id),

    CONSTRAINT fk_prediction_areas_prediction
        FOREIGN KEY (prediction_id)
        REFERENCES disaster_predictions(prediction_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_prediction_areas_district
        FOREIGN KEY (district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 14B. PREDICTION RUNS (ML MODEL EXECUTION HISTORY)
-- =========================================================

CREATE TABLE IF NOT EXISTS prediction_runs (
    run_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    state_id BIGINT UNSIGNED NOT NULL,
    prediction_model_id BIGINT UNSIGNED NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    probability_percent DECIMAL(5,2) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    class_probabilities JSON DEFAULT NULL,
    weather_features JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY fk_prediction_runs_model (prediction_model_id),
    KEY idx_prediction_runs_state_time (state_id, created_at),
    CONSTRAINT fk_prediction_runs_model FOREIGN KEY (prediction_model_id) REFERENCES prediction_models (prediction_model_id),
    CONSTRAINT fk_prediction_runs_state FOREIGN KEY (state_id) REFERENCES states (state_id)
);

-- =========================================================
-- 15. RESOURCE REQUIREMENT RULES
-- =========================================================

CREATE TABLE resource_requirement_rules (
    rule_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    disaster_type_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,

    severity ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL,

    quantity_per_person DECIMAL(15,5) NULL,
    fixed_quantity DECIMAL(15,5) NULL,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_requirement_rule
        UNIQUE (
            disaster_type_id,
            resource_id,
            severity
        ),

    CONSTRAINT fk_rules_disaster_type
        FOREIGN KEY (disaster_type_id)
        REFERENCES disaster_types(disaster_type_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_rules_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 16. PREDICTED RESOURCE REQUIREMENTS
-- =========================================================

CREATE TABLE predicted_resource_requirements (
    predicted_requirement_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    prediction_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,

    quantity_required DECIMAL(15,3) NOT NULL,
    quantity_available DECIMAL(15,3) NOT NULL DEFAULT 0,
    quantity_shortage DECIMAL(15,3) NOT NULL DEFAULT 0,

    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_prediction_resource
        UNIQUE (prediction_id, resource_id),

    CONSTRAINT chk_requirement_quantity
        CHECK (quantity_required >= 0),

    CONSTRAINT chk_requirement_available
        CHECK (quantity_available >= 0),

    CONSTRAINT chk_requirement_shortage
        CHECK (quantity_shortage >= 0),

    CONSTRAINT fk_predicted_requirements_prediction
        FOREIGN KEY (prediction_id)
        REFERENCES disaster_predictions(prediction_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_predicted_requirements_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 17. RESOURCE REQUESTS
-- =========================================================

CREATE TABLE resource_requests (
    resource_request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    prediction_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NOT NULL,

    state_id BIGINT UNSIGNED NOT NULL,

    request_status ENUM(
        'PENDING_STATE_APPROVAL',
        'STATE_APPROVED',
        'STATE_REJECTED',
        'PENDING_NATIONAL_APPROVAL',
        'NATIONAL_APPROVED',
        'NATIONAL_REJECTED',
        'ALLOCATED',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING_STATE_APPROVAL',

    priority ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ) NOT NULL DEFAULT 'MEDIUM',

    reason TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_prediction
        FOREIGN KEY (prediction_id)
        REFERENCES disaster_predictions(prediction_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_requests_user
        FOREIGN KEY (requested_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_requests_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 18. RESOURCE REQUEST ITEMS
-- =========================================================

CREATE TABLE resource_request_items (
    request_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    resource_request_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,

    quantity_requested DECIMAL(15,3) NOT NULL,
    quantity_approved DECIMAL(15,3) NOT NULL DEFAULT 0,

    CONSTRAINT uq_request_resource
        UNIQUE (resource_request_id, resource_id),

    CONSTRAINT chk_requested_quantity
        CHECK (quantity_requested > 0),

    CONSTRAINT chk_approved_quantity
        CHECK (quantity_approved >= 0),

    CONSTRAINT fk_request_items_request
        FOREIGN KEY (resource_request_id)
        REFERENCES resource_requests(resource_request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_request_items_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 19. APPROVAL ACTIONS
-- =========================================================

CREATE TABLE approval_actions (
    approval_action_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    resource_request_id BIGINT UNSIGNED NOT NULL,
    acted_by BIGINT UNSIGNED NOT NULL,

    approval_level ENUM(
        'STATE',
        'NATIONAL'
    ) NOT NULL,

    action ENUM(
        'APPROVED',
        'REJECTED'
    ) NOT NULL,

    comments TEXT,

    acted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_approval_request
        FOREIGN KEY (resource_request_id)
        REFERENCES resource_requests(resource_request_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_approval_user
        FOREIGN KEY (acted_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 20. QUANTUM OPTIMIZATION RUNS
-- =========================================================

CREATE TABLE optimization_runs (
    optimization_run_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    resource_request_id BIGINT UNSIGNED NOT NULL,

    algorithm_name VARCHAR(150) NOT NULL,
    algorithm_version VARCHAR(50),

    status ENUM(
        'PENDING',
        'RUNNING',
        'COMPLETED',
        'FAILED'
    ) NOT NULL DEFAULT 'PENDING',

    objective_value DECIMAL(20,6) NULL,

    input_data JSON NULL,
    output_data JSON NULL,

    started_at DATETIME NULL,
    completed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_optimization_request
        FOREIGN KEY (resource_request_id)
        REFERENCES resource_requests(resource_request_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 21. RESOURCE ALLOCATIONS
-- =========================================================

CREATE TABLE resource_allocations (
    allocation_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    resource_request_id BIGINT UNSIGNED NOT NULL,
    optimization_run_id BIGINT UNSIGNED NULL,

    allocated_by BIGINT UNSIGNED NOT NULL,

    allocation_status ENUM(
        'PLANNED',
        'APPROVED',
        'DISPATCHED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PLANNED',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_allocations_request
        FOREIGN KEY (resource_request_id)
        REFERENCES resource_requests(resource_request_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_allocations_optimization
        FOREIGN KEY (optimization_run_id)
        REFERENCES optimization_runs(optimization_run_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_allocations_user
        FOREIGN KEY (allocated_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 22. RESOURCE ALLOCATION ITEMS
-- =========================================================

CREATE TABLE resource_allocation_items (
    allocation_item_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    allocation_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    warehouse_id BIGINT UNSIGNED NOT NULL,

    quantity_allocated DECIMAL(15,3) NOT NULL,

    CONSTRAINT uq_allocation_resource_warehouse
        UNIQUE (
            allocation_id,
            resource_id,
            warehouse_id
        ),

    CONSTRAINT chk_allocated_quantity
        CHECK (quantity_allocated > 0),

    CONSTRAINT fk_allocation_items_allocation
        FOREIGN KEY (allocation_id)
        REFERENCES resource_allocations(allocation_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_allocation_items_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_allocation_items_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouses(warehouse_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================
-- 23. RESOURCE MOVEMENTS
-- =========================================================

CREATE TABLE resource_movements (
    movement_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    allocation_id BIGINT UNSIGNED NOT NULL,

    from_warehouse_id BIGINT UNSIGNED NOT NULL,
    to_state_id BIGINT UNSIGNED NOT NULL,
    to_district_id BIGINT UNSIGNED NULL,

    resource_id BIGINT UNSIGNED NOT NULL,

    quantity DECIMAL(15,3) NOT NULL,

    movement_status ENUM(
        'PLANNED',
        'DISPATCHED',
        'IN_TRANSIT',
        'DELIVERED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PLANNED',

    dispatched_at DATETIME NULL,
    delivered_at DATETIME NULL,

    tracking_reference VARCHAR(150) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movements_allocation
        FOREIGN KEY (allocation_id)
        REFERENCES resource_allocations(allocation_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movements_warehouse
        FOREIGN KEY (from_warehouse_id)
        REFERENCES warehouses(warehouse_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movements_state
        FOREIGN KEY (to_state_id)
        REFERENCES states(state_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movements_district
        FOREIGN KEY (to_district_id)
        REFERENCES districts(district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_movements_resource
        FOREIGN KEY (resource_id)
        REFERENCES resources(resource_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_movement_quantity
        CHECK (quantity > 0)
);

-- =========================================================
-- 24. RESOURCE RECEIPTS
-- =========================================================

CREATE TABLE resource_receipts (
    receipt_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    movement_id BIGINT UNSIGNED NOT NULL,
    received_by BIGINT UNSIGNED NOT NULL,

    quantity_received DECIMAL(15,3) NOT NULL,

    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT,

    CONSTRAINT fk_receipts_movement
        FOREIGN KEY (movement_id)
        REFERENCES resource_movements(movement_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipts_user
        FOREIGN KEY (received_by)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_received_quantity
        CHECK (quantity_received > 0)
);

-- =========================================================
-- 25. BLOCKCHAIN TRANSACTIONS
-- =========================================================

CREATE TABLE blockchain_transactions (
    blockchain_transaction_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,

    transaction_hash VARCHAR(255) NOT NULL UNIQUE,

    blockchain_network VARCHAR(100) NOT NULL,
    block_number BIGINT UNSIGNED NULL,

    transaction_status ENUM(
        'PENDING',
        'CONFIRMED',
        'FAILED'
    ) NOT NULL DEFAULT 'PENDING',

    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 26. NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    notification_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    related_entity_type VARCHAR(100),
    related_entity_id BIGINT UNSIGNED,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================
-- 27. AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    audit_log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,

    old_data JSON NULL,
    new_data JSON NULL,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================================================
-- 28. WAREHOUSE STOCK REQUESTS & ALLOTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS warehouse_stock_requests (
    stock_request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT UNSIGNED NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    requested_by BIGINT UNSIGNED NOT NULL,
    quantity_requested DECIMAL(15,3) NOT NULL,
    quantity_allotted DECIMAL(15,3) NOT NULL DEFAULT 0,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
    status ENUM('PENDING_ALLOTMENT', 'ALLOTTED', 'REJECTED') NOT NULL DEFAULT 'PENDING_ALLOTMENT',
    allotment_source VARCHAR(100) NOT NULL DEFAULT 'CENTRAL_NATIONAL_RESERVE',
    reason TEXT NULL,
    allotted_by BIGINT UNSIGNED NULL,
    allotted_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_wsr_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (warehouse_id) ON DELETE CASCADE,
    CONSTRAINT fk_wsr_resource FOREIGN KEY (resource_id) REFERENCES resources (resource_id) ON DELETE RESTRICT,
    CONSTRAINT fk_wsr_user FOREIGN KEY (requested_by) REFERENCES users (user_id) ON DELETE RESTRICT
);

CREATE TABLE state_locations (
    state_location_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    state_id BIGINT UNSIGNED NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_state_locations_state
        FOREIGN KEY (state_id)
        REFERENCES states(state_id),

    CONSTRAINT uq_state_location
        UNIQUE (state_id)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_satellite_observation_time
    ON satellite_observations(observation_time);

CREATE INDEX idx_weather_observation_time
    ON weather_observations(observation_time);

CREATE INDEX idx_disaster_event_state
    ON disaster_events(state_id);

CREATE INDEX idx_disaster_event_status
    ON disaster_events(event_status);

CREATE INDEX idx_prediction_event
    ON disaster_predictions(disaster_event_id);

CREATE INDEX idx_prediction_time
    ON disaster_predictions(prediction_time);

CREATE INDEX idx_request_status
    ON resource_requests(request_status);

CREATE INDEX idx_request_state
    ON resource_requests(state_id);

CREATE INDEX idx_movements_status
    ON resource_movements(movement_status);

CREATE INDEX idx_notifications_user_read
    ON notifications(user_id, is_read);

CREATE INDEX idx_audit_entity
    ON audit_logs(entity_type, entity_id);
    
    
    
DESCRIBE satellite_observations;

SELECT * FROM satellite_sources;

SELECT
    observation_id,
    satellite_source_id,
    observation_time,
    min_latitude,
    max_latitude,
    min_longitude,
    max_longitude,
    image_url,
    cloud_coverage,
    metadata,
    created_at
FROM satellite_observations
ORDER BY observation_id DESC
LIMIT 5;

INSERT INTO users (
    role_id,
    state_id,
    district_id,
    full_name,
    email,
    password_hash
)
SELECT
    role_id,
    1,
    NULL,
    'Kerala State Disaster Management Head',
    'KeralaState.head@disaster.local',
    '$2b$10$kyXXB3.k3VTOjZGeWKUXzOb89/gB0ArN/TSArkjI1wxC98LU2k.bC'
FROM roles
WHERE role_name = 'STATE_HEAD';

delete from users where role_id = 2;

Alter table satellite_observations rename column observation_time to observationDateTime;

DESCRIBE weather_observations;


UPDATE users
SET password_hash = '$2b$10$bFtbgv0vmPEnwqGplL2tgekqRxLnpfBOIFRrRwh7vV0pgZJkS0Ga6'
WHERE email = 'national.head@disaster.local';

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
    2,
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
    probability,
    severity,
    affected_population,
    confidence_score
FROM disaster_predictions
ORDER BY prediction_id DESC
LIMIT 1;


SELECT
    pr.predicted_requirement_id,
    pr.prediction_id,
    pr.resource_id,
    r.resource_name,
    r.unit,
    pr.quantity_required,
    pr.quantity_available,
    pr.quantity_shortage,
    pr.calculated_at
FROM predicted_resource_requirements pr
JOIN resources r
    ON r.resource_id = pr.resource_id
WHERE pr.prediction_id = 1;


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
    'Test Kerala Flood - Shortage Scenario',
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
    3,
    1,
    1,
    1,
    NOW(),
    0.93,
    'HIGH',
    DATE_ADD(NOW(), INTERVAL 4 HOUR),
    DATE_ADD(NOW(), INTERVAL 36 HOUR),
    750.000,
    200000,
    0.91,
    JSON_OBJECT(
        'test_prediction', true,
        'scenario', 'shortage_test',
        'source', 'manual_test',
        'disaster', 'FLOOD',
        'note', 'Controlled shortage scenario for resource request workflow'
    )
);


SELECT
    prediction_id,
    disaster_event_id,
    probability,
    severity,
    affected_population,
    confidence_score
FROM disaster_predictions
ORDER BY prediction_id DESC
LIMIT 1;


SELECT
    pr.predicted_requirement_id,
    pr.prediction_id,
    r.resource_name,
    r.unit,
    pr.quantity_required,
    pr.quantity_available,
    pr.quantity_shortage
FROM predicted_resource_requirements pr
JOIN resources r
    ON r.resource_id = pr.resource_id
WHERE pr.prediction_id = 3;


SELECT
    user_id,
    email,
    role_id,
    state_id
FROM users
ORDER BY user_id;

SELECT
    u.user_id,
    u.email,
    u.role_id,
    r.role_name,
    u.state_id
FROM users u
JOIN roles r
    ON r.role_id = u.role_id
ORDER BY u.user_id;


SELECT
    prediction_id,
    severity,
    affected_population
FROM disaster_predictions
ORDER BY prediction_id DESC
LIMIT 1;


SELECT
    ri.request_item_id,
    ri.resource_request_id,
    r.resource_name,
    r.unit,
    ri.quantity_requested,
    ri.quantity_approved
FROM resource_request_items ri
JOIN resources r
    ON r.resource_id = ri.resource_id
ORDER BY ri.request_item_id DESC;


SELECT
    user_id,
    email,
    role_id,
    state_id
FROM users;


DESCRIBE disaster_types;

DESCRIBE states;


DESCRIBE approval_actions;


SELECT
    resource_request_id,
    prediction_id,
    requested_by,
    state_id,
    request_status,
    priority,
    reason
FROM resource_requests
WHERE resource_request_id = 1;

SELECT
    approval_action_id,
    resource_request_id,
    acted_by,
    approval_level,
    action,
    comments,
    acted_at
FROM approval_actions
WHERE resource_request_id = 1
ORDER BY approval_action_id;


SELECT
    resource_request_id,
    request_status,
    state_id,
    priority
FROM resource_requests
WHERE resource_request_id = 1;


SELECT
    approval_action_id,
    resource_request_id,
    acted_by,
    approval_level,
    action,
    comments,
    acted_at
FROM approval_actions
WHERE resource_request_id = 1
ORDER BY approval_action_id;

SELECT
    resource_request_id,
    request_status
FROM resource_requests
WHERE resource_request_id = 1;

SELECT
    approval_action_id,
    resource_request_id,
    acted_by,
    approval_level,
    action,
    comments,
    acted_at
FROM approval_actions
WHERE resource_request_id = 1
ORDER BY approval_action_id;

DESCRIBE resource_allocations;

DESCRIBE resource_allocation_items;

DESCRIBE resource_movements;

DESCRIBE warehouses;

DESCRIBE warehouse_resources;

SELECT *
FROM warehouses;

SELECT
    wr.warehouse_resource_id,
    wr.warehouse_id,
    w.warehouse_name,
    wr.resource_id,
    r.resource_name,
    r.unit,
    wr.quantity_available,
    wr.quantity_reserved
FROM warehouse_resources wr
JOIN warehouses w
    ON w.warehouse_id = wr.warehouse_id
JOIN resources r
    ON r.resource_id = wr.resource_id
ORDER BY wr.warehouse_id, r.resource_name;

SELECT
    allocation_id,
    resource_request_id,
    optimization_run_id,
    allocated_by,
    allocation_status,
    created_at
FROM resource_allocations
WHERE resource_request_id = 1;


SELECT
    rai.allocation_item_id,
    rai.allocation_id,
    r.resource_name,
    w.warehouse_name,
    rai.quantity_allocated
FROM resource_allocation_items rai
JOIN resources r
    ON r.resource_id = rai.resource_id
JOIN warehouses w
    ON w.warehouse_id = rai.warehouse_id
WHERE rai.allocation_id = 1
ORDER BY rai.allocation_item_id;

SELECT
    w.warehouse_name,
    r.resource_name,
    wr.quantity_available,
    wr.quantity_reserved
FROM warehouse_resources wr
JOIN warehouses w
    ON w.warehouse_id = wr.warehouse_id
JOIN resources r
    ON r.resource_id = wr.resource_id
WHERE wr.resource_id IN (1, 2)
ORDER BY wr.warehouse_id, wr.resource_id;

SELECT
    movement_id,
    allocation_id,
    from_warehouse_id,
    to_state_id,
    to_district_id,
    resource_id,
    quantity,
    movement_status
FROM resource_movements
WHERE allocation_id = 1
ORDER BY movement_id;


DESCRIBE optimization_runs;

DESCRIBE prediction_areas;

SELECT *
FROM prediction_areas
WHERE prediction_id = 3;



SELECT
    dp.prediction_id,
    dp.disaster_event_id,
    de.disaster_type_id,
    dt.disaster_name,
    de.state_id,
    s.state_name,
    de.district_id
FROM disaster_predictions dp
JOIN disaster_events de
    ON de.disaster_event_id = dp.disaster_event_id
JOIN disaster_types dt
    ON dt.disaster_type_id = de.disaster_type_id
JOIN states s
    ON s.state_id = de.state_id
WHERE dp.prediction_id = 3;


DESCRIBE states;

INSERT INTO state_locations
(state_id, latitude, longitude)
VALUES
(1, 10.8505169, 76.2710833),
(2, 13.0826802, 80.2707184),
(3, 15.3172775, 75.7138884);

SELECT
    sl.state_location_id,
    sl.state_id,
    s.state_name,
    sl.latitude,
    sl.longitude
FROM state_locations sl
JOIN states s
    ON s.state_id = sl.state_id;
    
    
SELECT
    w.warehouse_id,
    w.warehouse_name,
    w.state_id,
    s.state_name,
    w.latitude AS warehouse_latitude,
    w.longitude AS warehouse_longitude,
    r.resource_id,
    r.resource_name,
    r.unit,
    wr.quantity_available,
    wr.quantity_reserved,
    (wr.quantity_available - wr.quantity_reserved) AS usable_quantity
FROM warehouses w
JOIN states s
    ON s.state_id = w.state_id
JOIN warehouse_resources wr
    ON wr.warehouse_id = w.warehouse_id
JOIN resources r
    ON r.resource_id = wr.resource_id
WHERE r.resource_id IN (1, 2)
ORDER BY r.resource_id, w.warehouse_id;


SELECT
    rr.resource_request_id,
    rr.prediction_id,
    rr.request_status,
    rr.priority,
    ra.allocation_id,
    ra.allocation_status
FROM resource_requests rr
LEFT JOIN resource_allocations ra
    ON ra.resource_request_id = rr.resource_request_id
WHERE rr.resource_request_id = 1;


SELECT
    rai.allocation_item_id,
    rai.allocation_id,
    w.warehouse_name,
    r.resource_name,
    rai.quantity_allocated
FROM resource_allocation_items rai
JOIN warehouses w
    ON w.warehouse_id = rai.warehouse_id
JOIN resources r
    ON r.resource_id = rai.resource_id
WHERE rai.allocation_id = (
    SELECT allocation_id
    FROM resource_allocations
    WHERE resource_request_id = 1
    LIMIT 1
);

SELECT
    w.warehouse_id,
    w.warehouse_name,
    r.resource_id,
    r.resource_name,
    r.unit,
    wr.quantity_available,
    wr.quantity_reserved,
    (wr.quantity_available - wr.quantity_reserved) AS usable_quantity
FROM warehouse_resources wr
JOIN warehouses w
    ON w.warehouse_id = wr.warehouse_id
JOIN resources r
    ON r.resource_id = wr.resource_id
WHERE (wr.quantity_available - wr.quantity_reserved) > 0
ORDER BY w.warehouse_id, r.resource_id;

SELECT
    resource_request_id,
    prediction_id,
    requested_by,
    state_id,
    request_status,
    priority,
    reason
FROM resource_requests
ORDER BY resource_request_id;


INSERT INTO resource_requests
(
    prediction_id,
    requested_by,
    state_id,
    request_status,
    priority,
    reason
)
VALUES
(
    3,
    1,
    1,
    'PENDING_STATE_APPROVAL',
    'CRITICAL',
    'Quantum optimization integration test for Kerala Medical Kit allocation'
);

SELECT
    resource_request_id,
    prediction_id,
    requested_by,
    state_id,
    request_status,
    priority,
    reason
FROM resource_requests
ORDER BY resource_request_id DESC
LIMIT 1;

INSERT INTO resource_request_items
(
    resource_request_id,
    resource_id,
    quantity_requested,
    quantity_approved
)
VALUES
(
    2,
    3,
    15000,
    0
);


SELECT
    rri.request_item_id,
    rri.resource_request_id,
    rri.resource_id,
    r.resource_name,
    r.unit,
    rri.quantity_requested,
    rri.quantity_approved
FROM resource_request_items rri
JOIN resources r
    ON r.resource_id = rri.resource_id
WHERE rri.resource_request_id = 2;


SELECT
    optimization_run_id,
    input_data
FROM optimization_runs
WHERE optimization_run_id = 3;


SELECT
    optimization_run_id,
    output_data
FROM optimization_runs
WHERE optimization_run_id = 3;

SELECT
    resource_request_id,
    request_status,
    priority
FROM resource_requests
WHERE resource_request_id = 2;


SELECT
    optimization_run_id,
    resource_request_id,
    algorithm_name,
    status
FROM optimization_runs
WHERE optimization_run_id = 3;

SELECT
    resource_request_id,
    prediction_id,
    requested_by,
    state_id,
    request_status,
    priority
FROM resource_requests
WHERE resource_request_id = 2;

SELECT
    allocation_id,
    resource_request_id,
    optimization_run_id,
    allocated_by,
    allocation_status
FROM resource_allocations
WHERE allocation_id = 2;

SELECT
    allocation_item_id,
    allocation_id,
    resource_id,
    warehouse_id,
    quantity_allocated
FROM resource_allocation_items
WHERE allocation_id = 2;

SELECT
    movement_id,
    allocation_id,
    from_warehouse_id,
    to_state_id,
    to_district_id,
    resource_id,
    quantity,
    movement_status
FROM resource_movements
WHERE allocation_id = 2;

SELECT
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved,
    quantity_available - quantity_reserved AS usable_quantity
FROM warehouse_resources
WHERE resource_id = 3
ORDER BY warehouse_id;


SELECT
    rm.movement_id,
    rm.movement_status,
    rm.quantity,
    rm.tracking_reference,
    rm.dispatched_at,
    rm.delivered_at,
    ra.allocation_status,
    rr.request_status
FROM resource_movements rm
JOIN resource_allocations ra
    ON ra.allocation_id = rm.allocation_id
JOIN resource_requests rr
    ON rr.resource_request_id = ra.resource_request_id
WHERE rm.allocation_id = 2
ORDER BY rm.movement_id;

DESCRIBE blockchain_transactions;

USE disaster_management;

SELECT
    resource_request_id,
    request_status
FROM resource_requests
WHERE resource_request_id = 5;
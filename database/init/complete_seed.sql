USE disaster_management;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Country & States
INSERT IGNORE INTO countries (country_id, country_name, country_code) VALUES (1, 'India', 'IN');
INSERT IGNORE INTO states (state_id, country_id, state_name, state_code) VALUES
(1, 1, 'Kerala', 'KL'),
(2, 1, 'Tamil Nadu', 'TN'),
(3, 1, 'Karnataka', 'KA'),
(4, 1, 'Odisha', 'OD'),
(5, 1, 'Assam', 'AS');

-- 2. State Locations
INSERT IGNORE INTO state_locations (state_id, latitude, longitude) VALUES
(1, 10.8505169, 76.2710833),
(2, 13.0826802, 80.2707184),
(3, 15.3172775, 75.7138884),
(4, 20.9517, 85.0985),
(5, 26.2006, 92.9376);

-- 3. Roles
INSERT IGNORE INTO roles (role_id, role_name, description) VALUES
(1, 'NATIONAL_HEAD', 'Single national-level disaster management head'),
(2, 'STATE_HEAD', 'Head responsible for a state'),
(3, 'DEPARTMENT_HEAD', 'Head of a disaster/resource department'),
(4, 'WAREHOUSE_MANAGER', 'Manages government resource warehouse'),
(5, 'FIELD_OFFICER', 'Field-level disaster response officer');

-- 4. Disaster Types
INSERT IGNORE INTO disaster_types (disaster_type_id, disaster_name, description) VALUES
(1, 'FLOOD', 'Flooding caused by excessive rainfall or rivers'),
(2, 'CYCLONE', 'Tropical cyclone and high winds'),
(3, 'EARTHQUAKE', 'Seismic activity and ground shaking'),
(4, 'LANDSLIDE', 'Debris flow and rockslide down slopes'),
(5, 'WILDFIRE', 'Uncontrolled forest fire'),
(6, 'DROUGHT', 'Severe precipitation deficiency');

-- 5. Departments
INSERT IGNORE INTO departments (department_id, state_id, department_name, department_code, description) VALUES
(1, 1, 'Kerala Disaster Management Authority', 'KDMA-01', 'State disaster management'),
(2, 1, 'Kerala Fire & Emergency Services', 'KFES-01', 'Rescue and emergency services'),
(3, 2, 'Tamil Nadu Disaster Management', 'TNDMA-01', 'State disaster management'),
(4, 2, 'Tamil Nadu Fire & Rescue', 'TNFES-01', 'Rescue and emergency operations');

-- 6. Resource Categories & Resources
INSERT IGNORE INTO resource_categories (resource_category_id, category_name, description) VALUES
(1, 'FOOD', 'Emergency rations and food packets'),
(2, 'WATER', 'Clean potable drinking water'),
(3, 'MEDICAL', 'First aid kits and emergency trauma supplies'),
(4, 'RESCUE', 'Rescue boats, life vests, and evacuation gear'),
(5, 'SHELTER', 'Emergency waterproof tents and tarpaulins'),
(6, 'POWER', 'Mobile generator sets and solar power');

INSERT IGNORE INTO resources (resource_id, resource_category_id, resource_name, unit, description) VALUES
(1, 1, 'Food Kit', 'KIT', 'Standard 72-hour family food packet'),
(2, 2, 'Drinking Water', 'LITRE', 'Purified bottled drinking water'),
(3, 3, 'Medical Kit', 'KIT', 'Emergency first response medical kit'),
(4, 4, 'Rescue Boat', 'UNIT', 'Inflatable motor rescue boat'),
(5, 5, 'Emergency Shelter', 'UNIT', 'Modular all-weather family tent'),
(6, 6, 'Emergency Generator', 'UNIT', '5kVA mobile diesel generator');

-- 7. Warehouses
INSERT IGNORE INTO warehouses (warehouse_id, state_id, department_id, warehouse_name, latitude, longitude, address, manager_user_id) VALUES
(1, 1, 1, 'Kerala Central Emergency Warehouse', 10.8505169, 76.2710833, 'Kochi Disaster Logistics Hub, Kerala', 3),
(2, 2, 3, 'Tamil Nadu Central Emergency Warehouse', 13.0826802, 80.2707184, 'Chennai Port Logistics Depot, Tamil Nadu', 4),
(3, 1, 1, 'Wayanad High-Altitude Relief Hub', 11.6854, 76.1320, 'Kalpetta Emergency Depot, Wayanad', 3);

-- 8. Warehouse Resources (Inventory)
INSERT INTO warehouse_resources (warehouse_id, resource_id, quantity_available, quantity_reserved) VALUES
(1, 1, 45000, 0),
(1, 2, 90000, 0),
(1, 3, 12000, 0),
(1, 4, 30, 0),
(1, 5, 1500, 0),
(1, 6, 40, 0),
(2, 1, 60000, 0),
(2, 2, 120000, 0),
(2, 3, 15000, 0),
(2, 4, 20, 0),
(2, 5, 2000, 0),
(2, 6, 50, 0),
(3, 1, 25000, 0),
(3, 2, 50000, 0),
(3, 3, 8000, 0),
(3, 4, 15, 0)
ON DUPLICATE KEY UPDATE quantity_available = VALUES(quantity_available);

-- 9. Prediction Models & Satellite Sources
INSERT IGNORE INTO satellite_sources (satellite_source_id, source_name, provider_name, api_name, description) VALUES
(1, 'Sentinel-1 SAR', 'Copernicus / ESA', 'Sentinel Hub', 'Synthetic Aperture Radar flood monitoring'),
(2, 'Sentinel-2 Optical', 'Copernicus / ESA', 'Sentinel Hub', 'Multispectral imagery');

INSERT IGNORE INTO prediction_models (prediction_model_id, model_name, model_version, model_type, description) VALUES
(1, 'Ensemble Flood & Cyclone Predictor', 'v2.4', 'MACHINE_LEARNING', 'Random Forest + XGBoost hybrid geospatial hazard classifier');

-- 10. Sample Active Disaster Event & Prediction
INSERT INTO disaster_events (disaster_event_id, disaster_type_id, state_id, event_name, event_status, created_at) VALUES
(1, 1, 1, 'Monsoon Inundation Warning - Kerala Lowlands', 'PREDICTED', NOW())
ON DUPLICATE KEY UPDATE event_name = VALUES(event_name);

INSERT INTO disaster_predictions (prediction_id, disaster_event_id, prediction_model_id, probability, severity, affected_area_km2, affected_population, confidence_score, expected_start_time, expected_end_time, prediction_details, prediction_time) VALUES
(1, 1, 1, 0.88, 'HIGH', 340.5, 45000, 0.91, DATE_ADD(NOW(), INTERVAL 4 HOUR), DATE_ADD(NOW(), INTERVAL 48 HOUR), '{"impact":"High probability of localized flash floods across coastal and river basin zones"}', NOW())
ON DUPLICATE KEY UPDATE severity = VALUES(severity), probability = VALUES(probability);

INSERT INTO predicted_resource_requirements (predicted_requirement_id, prediction_id, resource_id, quantity_required, quantity_available, quantity_shortage, calculated_at) VALUES
(1, 1, 1, 25000, 45000, 0, NOW()),
(2, 1, 2, 50000, 90000, 0, NOW()),
(3, 1, 3, 5000, 12000, 0, NOW()),
(4, 1, 4, 15, 30, 0, NOW())
ON DUPLICATE KEY UPDATE quantity_required = VALUES(quantity_required);

-- 11. Initial Stock Request
INSERT IGNORE INTO warehouse_stock_requests (stock_request_id, warehouse_id, resource_id, requested_by, quantity_requested, quantity_allotted, priority, status, allotment_source, reason) VALUES
(1, 1, 1, 3, 10000, 10000, 'HIGH', 'ALLOTTED', 'CENTRAL_NATIONAL_RESERVE', 'Pre-monsoon strategic buffer replenishment'),
(2, 1, 4, 3, 10, 0, 'CRITICAL', 'PENDING_ALLOTMENT', 'CENTRAL_NATIONAL_RESERVE', 'Additional inflatable rescue craft needed for coastal flooding');

-- 12. Demo Resource Requests across different lifecycle stages
INSERT INTO resource_requests (resource_request_id, prediction_id, requested_by, state_id, request_status, priority, reason, created_at) VALUES
(1, 1, 2, 1, 'PENDING_STATE_APPROVAL', 'CRITICAL', 'Urgent medical trauma kits needed for localized waterborne illnesses in flood sector', NOW()),
(2, 1, 2, 1, 'PENDING_NATIONAL_APPROVAL', 'HIGH', 'Emergency clean drinking water pouches and water filtration units for coastal communities', NOW()),
(3, 1, 2, 1, 'NATIONAL_APPROVED', 'CRITICAL', 'High-priority family food rations and nutritional kits for relief camps (Ready for Quantum Allocation)', NOW()),
(4, 1, 2, 1, 'ALLOCATED', 'HIGH', 'Emergency rescue boats and inflatable motorcraft for river overflow evacuation', DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE request_status = VALUES(request_status), reason = VALUES(reason);

-- 13. Request Items for each request
INSERT INTO resource_request_items (request_item_id, resource_request_id, resource_id, quantity_requested, quantity_approved) VALUES
(1, 1, 3, 2500, 0),
(2, 2, 2, 20000, 20000),
(3, 3, 1, 15000, 15000),
(4, 4, 4, 15, 15)
ON DUPLICATE KEY UPDATE quantity_requested = VALUES(quantity_requested), quantity_approved = VALUES(quantity_approved);

-- 14. Optimization Run for Request 4
INSERT INTO optimization_runs (optimization_run_id, resource_request_id, algorithm_name, status, execution_time_ms, created_at) VALUES
(1, 4, 'QAOA_QUANTUM_APPROXIMATE_OPTIMIZATION', 'COMPLETED', 1420, DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 15. Resource Allocation for Request 4
INSERT INTO resource_allocations (allocation_id, resource_request_id, optimization_run_id, allocated_by, allocation_status, created_at) VALUES
(1, 4, 1, 1, 'APPROVED', DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE allocation_status = VALUES(allocation_status);

-- 16. Resource Allocation Items (split across Kerala and Tamil Nadu warehouses)
INSERT INTO resource_allocation_items (allocation_item_id, allocation_id, resource_id, warehouse_id, quantity_allocated) VALUES
(1, 1, 4, 1, 10),
(2, 1, 4, 2, 5)
ON DUPLICATE KEY UPDATE quantity_allocated = VALUES(quantity_allocated);

-- 17. Resource Movements (Dispatches in transit and delivered)
INSERT INTO resource_movements (movement_id, allocation_id, from_warehouse_id, to_state_id, resource_id, quantity, movement_status, tracking_reference, dispatched_at, delivered_at, created_at) VALUES
(1, 1, 1, 1, 4, 10, 'DELIVERED', 'NDRF-LOG-KL-2026-081', DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(2, 1, 2, 1, 4, 5, 'IN_TRANSIT', 'NDRF-LOG-TN-2026-149', DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR))
ON DUPLICATE KEY UPDATE movement_status = VALUES(movement_status), tracking_reference = VALUES(tracking_reference);

-- 18. Blockchain transactions for audit trail
INSERT IGNORE INTO blockchain_transactions (blockchain_transaction_id, entity_type, entity_id, transaction_hash, blockchain_network, block_number, transaction_status, recorded_at) VALUES
(1, 'ALLOCATION', 1, '0x8f2d5a7b1c3e4f6a9b8c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a', 'Hardhat Local EVM', 101, 'CONFIRMED', NOW()),
(2, 'MOVEMENT', 1, '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 'Hardhat Local EVM', 102, 'CONFIRMED', NOW()),
(3, 'MOVEMENT', 2, '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'Hardhat Local EVM', 103, 'CONFIRMED', NOW());

SET FOREIGN_KEY_CHECKS = 1;

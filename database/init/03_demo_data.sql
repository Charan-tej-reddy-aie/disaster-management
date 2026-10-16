USE disaster_management;

-- =========================================================
-- DEPARTMENTS
-- =========================================================

INSERT INTO departments
(state_id, department_name, department_code, description)

SELECT
    state_id,
    'Flood Management Department',
    'FLOOD-KL',
    'Handles flood preparedness and response'
FROM states
WHERE state_code = 'KL';

INSERT INTO departments
(state_id, department_name, department_code, description)

SELECT
    state_id,
    'Fire and Rescue Department',
    'FIRE-KL',
    'Handles fire and rescue operations'
FROM states
WHERE state_code = 'KL';

INSERT INTO departments
(state_id, department_name, department_code, description)

SELECT
    state_id,
    'Flood Management Department',
    'FLOOD-TN',
    'Handles flood preparedness and response'
FROM states
WHERE state_code = 'TN';

INSERT INTO departments
(state_id, department_name, department_code, description)

SELECT
    state_id,
    'Fire and Rescue Department',
    'FIRE-TN',
    'Handles fire and rescue operations'
FROM states
WHERE state_code = 'TN';

-- =========================================================
-- WAREHOUSES
-- =========================================================

INSERT INTO warehouses
(
    state_id,
    district_id,
    department_id,
    warehouse_name,
    latitude,
    longitude,
    address
)

SELECT
    s.state_id,
    d.district_id,
    dep.department_id,
    'Kerala Central Emergency Warehouse',
    10.8505169,
    76.2710833,
    'Kerala Emergency Resource Storage'
FROM states s
LEFT JOIN districts d
    ON d.state_id = s.state_id
LEFT JOIN departments dep
    ON dep.state_id = s.state_id
    AND dep.department_code = 'FLOOD-KL'
WHERE s.state_code = 'KL'
LIMIT 1;

INSERT INTO warehouses
(
    state_id,
    district_id,
    department_id,
    warehouse_name,
    latitude,
    longitude,
    address
)

SELECT
    s.state_id,
    d.district_id,
    dep.department_id,
    'Tamil Nadu Central Emergency Warehouse',
    13.0826802,
    80.2707184,
    'Tamil Nadu Emergency Resource Storage'
FROM states s
LEFT JOIN districts d
    ON d.state_id = s.state_id
LEFT JOIN departments dep
    ON dep.state_id = s.state_id
    AND dep.department_code = 'FLOOD-TN'
WHERE s.state_code = 'TN'
LIMIT 1;

-- =========================================================
-- INVENTORY
-- =========================================================

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    50000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Kerala Central Emergency Warehouse'
AND r.resource_name = 'Food Kit';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    100000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Kerala Central Emergency Warehouse'
AND r.resource_name = 'Drinking Water';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    10000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Kerala Central Emergency Warehouse'
AND r.resource_name = 'Medical Kit';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    25,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Kerala Central Emergency Warehouse'
AND r.resource_name = 'Rescue Boat';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    50000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Tamil Nadu Central Emergency Warehouse'
AND r.resource_name = 'Food Kit';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    100000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Tamil Nadu Central Emergency Warehouse'
AND r.resource_name = 'Drinking Water';

INSERT INTO warehouse_resources
(
    warehouse_id,
    resource_id,
    quantity_available,
    quantity_reserved
)

SELECT
    w.warehouse_id,
    r.resource_id,
    12000,
    0
FROM warehouses w
CROSS JOIN resources r
WHERE w.warehouse_name = 'Tamil Nadu Central Emergency Warehouse'
AND r.resource_name = 'Medical Kit';



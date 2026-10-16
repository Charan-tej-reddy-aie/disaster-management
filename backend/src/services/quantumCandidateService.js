const pool = require("../config/database");


// ======================================================
// HAVERSINE DISTANCE
// ======================================================

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}


// ======================================================
// GET WAREHOUSE CANDIDATES
// ======================================================

async function getWarehouseCandidates({
    stateId,
    resourceId,
    requiredQuantity
}) {
    // --------------------------------------------------
    // 1. Get destination/requesting state location
    // --------------------------------------------------

    const [stateRows] = await pool.query(
        `
        SELECT
            state_id,
            latitude,
            longitude
        FROM state_locations
        WHERE state_id = ?
        LIMIT 1
        `,
        [stateId]
    );

    if (stateRows.length === 0) {
        throw new Error(
            `No location configured for state_id ${stateId}`
        );
    }

    const destination = stateRows[0];

    // --------------------------------------------------
    // 2. Get ALL warehouses containing this resource
    // --------------------------------------------------
    // IMPORTANT:
    // Do NOT filter by warehouse state.
    //
    // This allows:
    // Kerala request -> Kerala warehouse
    //                 -> Tamil Nadu warehouse
    //                 -> Karnataka warehouse
    // --------------------------------------------------

    const [warehouses] = await pool.query(
        `
        SELECT
            w.warehouse_id,
            w.warehouse_name,
            w.state_id AS warehouse_state_id,
            s.state_name AS warehouse_state_name,

            w.latitude AS warehouse_latitude,
            w.longitude AS warehouse_longitude,

            wr.resource_id,
            wr.quantity_available,
            wr.quantity_reserved

        FROM warehouse_resources wr

        INNER JOIN warehouses w
            ON w.warehouse_id = wr.warehouse_id

        INNER JOIN states s
            ON s.state_id = w.state_id

        WHERE wr.resource_id = ?

        ORDER BY w.warehouse_id
        `,
        [resourceId]
    );

    // --------------------------------------------------
    // 3. Calculate usable stock and distance
    // --------------------------------------------------

    const candidates = warehouses.map((warehouse) => {

        const available =
            Number(warehouse.quantity_available || 0);

        const reserved =
            Number(warehouse.quantity_reserved || 0);

        const usableQuantity =
            Math.max(0, available - reserved);

        const distanceKm =
            calculateDistanceKm(
                Number(warehouse.warehouse_latitude),
                Number(warehouse.warehouse_longitude),
                Number(destination.latitude),
                Number(destination.longitude)
            );

        return {
            warehouse_id: warehouse.warehouse_id,

            warehouse_name:
                warehouse.warehouse_name,

            warehouse_state_id:
                warehouse.warehouse_state_id,

            warehouse_state_name:
                warehouse.warehouse_state_name,

            resource_id:
                warehouse.resource_id,

            required_quantity:
                Number(requiredQuantity),

            usable_quantity:
                usableQuantity,

            available_quantity:
                available,

            reserved_quantity:
                reserved,

            distance_km:
                Number(distanceKm.toFixed(3))
        };
    });

    // --------------------------------------------------
    // 4. Sort nearest warehouse first
    // --------------------------------------------------

    candidates.sort(
        (a, b) =>
            a.distance_km - b.distance_km
    );

    return candidates;
}


module.exports = {
    calculateDistanceKm,
    getWarehouseCandidates
};
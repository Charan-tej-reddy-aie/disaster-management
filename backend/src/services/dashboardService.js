const pool = require("../config/database");

async function getDashboardData() {

  // --------------------------------------------------
  // 1. Prediction statistics
  // --------------------------------------------------

  const [[predictionStats]] = await pool.query(`
    SELECT
      COUNT(*) AS total_predictions,

      SUM(
        CASE
          WHEN severity = 'CRITICAL'
          THEN 1
          ELSE 0
        END
      ) AS critical_predictions,

      SUM(
        CASE
          WHEN severity = 'HIGH'
          THEN 1
          ELSE 0
        END
      ) AS high_predictions,

      SUM(
        CASE
          WHEN severity = 'MEDIUM'
          THEN 1
          ELSE 0
        END
      ) AS medium_predictions,

      SUM(
        CASE
          WHEN severity = 'LOW'
          THEN 1
          ELSE 0
        END
      ) AS low_predictions

    FROM disaster_predictions
  `);


  // --------------------------------------------------
  // 2. Warehouse statistics
  // --------------------------------------------------

  const [[warehouseStats]] = await pool.query(`
    SELECT
      COUNT(*) AS total_warehouses
    FROM warehouses
  `);


  // --------------------------------------------------
  // 3. Pending resource requests
  // --------------------------------------------------

  const [[requestStats]] = await pool.query(`
    SELECT
      COUNT(*) AS pending_requests
    FROM resource_requests
    WHERE request_status IN (
      'PENDING_STATE_APPROVAL',
      'PENDING_NATIONAL_APPROVAL'
    )
  `);


  // --------------------------------------------------
  // 4. Disaster predictions
  // --------------------------------------------------

  const [predictions] = await pool.query(`
    SELECT
      dp.prediction_id,
      dp.disaster_event_id,
      dp.prediction_time,
      dp.probability,
      dp.severity,
      dp.expected_start_time,
      dp.expected_end_time,
      dp.affected_area_km2,
      dp.affected_population,
      dp.confidence_score,

      dt.disaster_type_id,
      dt.disaster_name,

      de.event_name,
      de.event_status,

      s.state_id,
      s.state_name,

      sl.latitude AS state_latitude,
      sl.longitude AS state_longitude

    FROM disaster_predictions dp

    JOIN disaster_events de
      ON de.disaster_event_id = dp.disaster_event_id

    JOIN disaster_types dt
      ON dt.disaster_type_id = de.disaster_type_id

    JOIN states s
      ON s.state_id = de.state_id

    LEFT JOIN state_locations sl
      ON sl.state_id = s.state_id

    ORDER BY dp.prediction_time DESC

    LIMIT 50
  `);


  // --------------------------------------------------
  // 5. Warehouses
  // --------------------------------------------------

  const [warehouses] = await pool.query(`
    SELECT
      w.warehouse_id,
      w.warehouse_name,
      w.state_id,
      s.state_name,
      w.district_id,
      w.latitude,
      w.longitude,
      w.address,

      COALESCE(
        SUM(wr.quantity_available - wr.quantity_reserved),
        0
      ) AS total_usable_inventory

    FROM warehouses w

    JOIN states s
      ON s.state_id = w.state_id

    LEFT JOIN warehouse_resources wr
      ON wr.warehouse_id = w.warehouse_id

    GROUP BY
      w.warehouse_id,
      w.warehouse_name,
      w.state_id,
      s.state_name,
      w.district_id,
      w.latitude,
      w.longitude,
      w.address

    ORDER BY w.warehouse_id
  `);


  // --------------------------------------------------
  // 6. State locations
  // --------------------------------------------------

  const [states] = await pool.query(`
    SELECT
      sl.state_location_id,
      sl.state_id,
      s.state_name,
      sl.latitude,
      sl.longitude

    FROM state_locations sl

    JOIN states s
      ON s.state_id = sl.state_id

    ORDER BY s.state_name
  `);


  return {
    statistics: {
      predictions: Number(
        predictionStats.total_predictions || 0
      ),

      critical: Number(
        predictionStats.critical_predictions || 0
      ),

      high: Number(
        predictionStats.high_predictions || 0
      ),

      medium: Number(
        predictionStats.medium_predictions || 0
      ),

      low: Number(
        predictionStats.low_predictions || 0
      ),

      warehouses: Number(
        warehouseStats.total_warehouses || 0
      ),

      pendingRequests: Number(
        requestStats.pending_requests || 0
      ),
    },

    predictions,

    warehouses,

    states,
  };
}


// --------------------------------------------------
// Existing functions
// --------------------------------------------------

async function getDashboardPredictions() {

  const [rows] = await pool.query(`
    SELECT
      dp.prediction_id,
      dp.disaster_event_id,
      dp.prediction_time,
      dp.probability,
      dp.severity,
      dp.expected_start_time,
      dp.expected_end_time,
      dp.affected_area_km2,
      dp.affected_population,
      dp.confidence_score,

      dt.disaster_name,

      s.state_id,
      s.state_name,

      de.event_name,
      de.event_status

    FROM disaster_predictions dp

    JOIN disaster_events de
      ON de.disaster_event_id = dp.disaster_event_id

    JOIN disaster_types dt
      ON dt.disaster_type_id = de.disaster_type_id

    JOIN states s
      ON s.state_id = de.state_id

    ORDER BY dp.prediction_time DESC

    LIMIT 20
  `);

  return rows;
}


async function getDashboardStats() {

  const [[predictionStats]] = await pool.query(`
    SELECT
      COUNT(*) AS total_predictions,

      SUM(
        CASE
          WHEN severity = 'CRITICAL'
          THEN 1
          ELSE 0
        END
      ) AS critical_predictions,

      SUM(
        CASE
          WHEN severity = 'HIGH'
          THEN 1
          ELSE 0
        END
      ) AS high_predictions

    FROM disaster_predictions
  `);


  const [[warehouseStats]] = await pool.query(`
    SELECT COUNT(*) AS total_warehouses
    FROM warehouses
  `);


  const [[requestStats]] = await pool.query(`
    SELECT COUNT(*) AS pending_requests
    FROM resource_requests
    WHERE request_status IN (
      'PENDING_STATE_APPROVAL',
      'PENDING_NATIONAL_APPROVAL'
    )
  `);


  return {
    predictions: predictionStats,
    warehouses: warehouseStats,
    requests: requestStats,
  };
}


module.exports = {
  getDashboardData,
  getDashboardPredictions,
  getDashboardStats,
};
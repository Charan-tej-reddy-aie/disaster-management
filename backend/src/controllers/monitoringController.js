const pool = require("../config/database");

/*
 * GET /api/monitoring/states
 *
 * Returns the latest prediction/risk information
 * for every configured state location.
 */
const getStateMonitoring = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.state_id,
        s.state_name,

        sl.latitude,
        sl.longitude,

        dp.prediction_id,
        dp.prediction_time,
        dp.probability,
        dp.severity,
        dp.expected_start_time,
        dp.expected_end_time,
        dp.affected_area_km2,
        dp.affected_population,
        dp.confidence_score,

        dt.disaster_type_id,
        dt.type_name AS disaster_type,

        de.disaster_event_id,
        de.event_name,
        de.event_status

      FROM states s

      LEFT JOIN state_locations sl
        ON sl.state_id = s.state_id

      LEFT JOIN (
        SELECT dp1.*
        FROM disaster_predictions dp1
        INNER JOIN (
          SELECT
            disaster_event_id,
            MAX(prediction_id) AS latest_prediction_id
          FROM disaster_predictions
          GROUP BY disaster_event_id
        ) latest
          ON latest.latest_prediction_id = dp1.prediction_id
      ) dp
        ON dp.prediction_id = (
          SELECT MAX(dp2.prediction_id)
          FROM disaster_predictions dp2
          INNER JOIN disaster_events de2
            ON de2.disaster_event_id = dp2.disaster_event_id
          WHERE de2.state_id = s.state_id
        )

      LEFT JOIN disaster_events de
        ON de.disaster_event_id = dp.disaster_event_id

      LEFT JOIN disaster_types dt
        ON dt.disaster_type_id = de.disaster_type_id

      WHERE sl.state_location_id IS NOT NULL

      ORDER BY s.state_id
    `);

    return res.json({
      success: true,
      count: rows.length,
      states: rows
    });

  } catch (error) {
    console.error("Monitoring states error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/*
 * GET /api/monitoring/statistics
 *
 * National dashboard statistics.
 */
const getMonitoringStatistics = async (req, res) => {
  try {

    const [[predictionStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_predictions,

        SUM(
          CASE
            WHEN severity IN ('HIGH', 'CRITICAL')
            THEN 1
            ELSE 0
          END
        ) AS high_risk_predictions,

        SUM(
          CASE
            WHEN severity = 'CRITICAL'
            THEN 1
            ELSE 0
          END
        ) AS critical_predictions

      FROM disaster_predictions
    `);


    const [[eventStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_events,

        SUM(
          CASE
            WHEN event_status IN ('WARNING', 'ACTIVE')
            THEN 1
            ELSE 0
          END
        ) AS active_warnings

      FROM disaster_events
    `);


    const [[resourceStats]] = await pool.query(`
      SELECT
        COUNT(*) AS resource_requirement_records,

        COALESCE(
          SUM(quantity_required),
          0
        ) AS total_resources_required,

        COALESCE(
          SUM(quantity_shortage),
          0
        ) AS total_resource_shortage

      FROM predicted_resource_requirements
    `);


    return res.json({
      success: true,

      statistics: {
        totalPredictions:
          Number(predictionStats.total_predictions || 0),

        highRiskPredictions:
          Number(predictionStats.high_risk_predictions || 0),

        criticalPredictions:
          Number(predictionStats.critical_predictions || 0),

        totalEvents:
          Number(eventStats.total_events || 0),

        activeWarnings:
          Number(eventStats.active_warnings || 0),

        resourceRequirementRecords:
          Number(resourceStats.resource_requirement_records || 0),

        totalResourcesRequired:
          Number(resourceStats.total_resources_required || 0),

        totalResourceShortage:
          Number(resourceStats.total_resource_shortage || 0)
      }
    });

  } catch (error) {
    console.error("Monitoring statistics error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/*
 * GET /api/monitoring/recent
 *
 * Recent disaster predictions.
 */
const getRecentPredictions = async (req, res) => {
  try {

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const [rows] = await pool.query(
      `
      SELECT
        dp.prediction_id,
        dp.prediction_time,
        dp.probability,
        dp.severity,
        dp.expected_start_time,
        dp.expected_end_time,
        dp.affected_area_km2,
        dp.affected_population,
        dp.confidence_score,

        de.disaster_event_id,
        de.event_name,
        de.event_status,

        dt.type_name AS disaster_type,

        s.state_id,
        s.state_name

      FROM disaster_predictions dp

      INNER JOIN disaster_events de
        ON de.disaster_event_id = dp.disaster_event_id

      INNER JOIN disaster_types dt
        ON dt.disaster_type_id = de.disaster_type_id

      INNER JOIN states s
        ON s.state_id = de.state_id

      ORDER BY dp.prediction_time DESC

      LIMIT ${limit}
      `
    );

    return res.json({
      success: true,
      count: rows.length,
      predictions: rows
    });

  } catch (error) {
    console.error("Recent predictions error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
 * GET /api/monitoring/blockchain/all
 *
 * Full ledger of recent blockchain transactions
 */
const getAllBlockchainAudits = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const [rows] = await pool.query(`
      SELECT 
        bt.blockchain_transaction_id,
        bt.entity_type,
        bt.entity_id,
        bt.transaction_hash,
        bt.blockchain_network,
        bt.block_number,
        bt.transaction_status,
        bt.recorded_at,
        rm.movement_status,
        rm.quantity,
        r.resource_name,
        w.warehouse_name,
        s.state_name
      FROM blockchain_transactions bt
      LEFT JOIN resource_movements rm
        ON bt.entity_type = 'RESOURCE_MOVEMENT' AND bt.entity_id = rm.movement_id
      LEFT JOIN resources r
        ON rm.resource_id = r.resource_id
      LEFT JOIN warehouses w
        ON rm.from_warehouse_id = w.warehouse_id
      LEFT JOIN states s
        ON rm.to_state_id = s.state_id
      ORDER BY bt.blockchain_transaction_id DESC
      LIMIT ${limit}
    `);

    return res.json({
      success: true,
      count: rows.length,
      transactions: rows
    });
  } catch (error) {
    console.error("All blockchain audits error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getStateMonitoring,
  getMonitoringStatistics,
  getRecentPredictions,
  getAllBlockchainAudits
};
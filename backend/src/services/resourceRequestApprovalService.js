const pool = require("../config/database");


// ======================================================
// GET PENDING STATE APPROVAL REQUESTS
// ======================================================

async function getPendingStateRequests(stateId) {
  const connection = await pool.getConnection();

  try {
    const [requests] = await connection.query(
      `
      SELECT
        rr.resource_request_id,
        rr.prediction_id,
        rr.requested_by,
        rr.state_id,
        rr.request_status,
        rr.priority,
        rr.reason,
        rr.created_at,

        s.state_name,

        dt.disaster_name,

        dp.probability,
        dp.severity,
        dp.affected_area_km2,
        dp.affected_population,
        dp.expected_start_time,
        dp.expected_end_time

      FROM resource_requests rr

      JOIN states s
        ON s.state_id = rr.state_id

      JOIN disaster_predictions dp
        ON dp.prediction_id = rr.prediction_id

      JOIN disaster_events de
        ON de.disaster_event_id = dp.disaster_event_id

      JOIN disaster_types dt
        ON dt.disaster_type_id = de.disaster_type_id

      WHERE rr.state_id = ?
        AND rr.request_status = 'PENDING_STATE_APPROVAL'

      ORDER BY
        CASE rr.priority
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        rr.created_at ASC
      `,
      [stateId]
    );


    for (const request of requests) {

      const [items] = await connection.query(
        `
        SELECT
          ri.request_item_id,
          ri.resource_id,
          r.resource_name,
          r.unit,
          ri.quantity_requested,
          ri.quantity_approved

        FROM resource_request_items ri

        JOIN resources r
          ON r.resource_id = ri.resource_id

        WHERE ri.resource_request_id = ?

        ORDER BY r.resource_name
        `,
        [request.resource_request_id]
      );

      request.items = items;
    }


    return requests;

  } finally {
    connection.release();
  }
}



// ======================================================
// STATE HEAD APPROVE REQUEST
// ======================================================

async function approveStateRequest({
  requestId,
  actedBy,
  stateId,
  comments
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------
    // Get request and verify state
    // --------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        resource_request_id,
        prediction_id,
        state_id,
        request_status
      FROM resource_requests
      WHERE resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );


    if (requests.length === 0) {
      throw new Error("Resource request not found");
    }


    const request = requests[0];


    // --------------------------------------------------
    // Verify request belongs to State Head's state
    // --------------------------------------------------

    if (Number(request.state_id) !== Number(stateId)) {
      throw new Error(
        "You are not authorized to approve a request from another state"
      );
    }


    // --------------------------------------------------
    // Verify current status
    // --------------------------------------------------

    if (request.request_status !== "PENDING_STATE_APPROVAL") {
      throw new Error(
        `Request is not pending state approval. Current status: ${request.request_status}`
      );
    }


    // --------------------------------------------------
    // Update request status
    // --------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status = 'PENDING_NATIONAL_APPROVAL'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------
    // Record approval action
    // --------------------------------------------------

    await connection.query(
      `
      INSERT INTO approval_actions
      (
        resource_request_id,
        acted_by,
        approval_level,
        action,
        comments
      )
      VALUES (?, ?, 'STATE', 'APPROVED', ?)
      `,
      [
        requestId,
        actedBy,
        comments || "Approved by State Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      status: "PENDING_NATIONAL_APPROVAL"
    };

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();

  }
}



// ======================================================
// STATE HEAD REJECT REQUEST
// ======================================================

async function rejectStateRequest({
  requestId,
  actedBy,
  stateId,
  comments
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------
    // Get request
    // --------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        resource_request_id,
        state_id,
        request_status
      FROM resource_requests
      WHERE resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );


    if (requests.length === 0) {
      throw new Error("Resource request not found");
    }


    const request = requests[0];


    // --------------------------------------------------
    // Verify state ownership
    // --------------------------------------------------

    if (Number(request.state_id) !== Number(stateId)) {
      throw new Error(
        "You are not authorized to reject a request from another state"
      );
    }


    // --------------------------------------------------
    // Verify status
    // --------------------------------------------------

    if (request.request_status !== "PENDING_STATE_APPROVAL") {
      throw new Error(
        `Request is not pending state approval. Current status: ${request.request_status}`
      );
    }


    // --------------------------------------------------
    // Update request
    // --------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status = 'STATE_REJECTED'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------
    // Record rejection
    // --------------------------------------------------

    await connection.query(
      `
      INSERT INTO approval_actions
      (
        resource_request_id,
        acted_by,
        approval_level,
        action,
        comments
      )
      VALUES (?, ?, 'STATE', 'REJECTED', ?)
      `,
      [
        requestId,
        actedBy,
        comments || "Rejected by State Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      status: "STATE_REJECTED"
    };

  } catch (error) {

    await connection.rollback();
    throw error;

  } finally {

    connection.release();

  }
}



module.exports = {
  getPendingStateRequests,
  approveStateRequest,
  rejectStateRequest
};
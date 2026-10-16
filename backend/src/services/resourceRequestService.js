const pool = require("../config/database");


// ============================================================
// 1. CREATE RESOURCE REQUEST FROM SHORTAGE
// ============================================================

async function createShortageRequest({
  predictionId,
  requestedBy,
  stateId,
  priority,
  reason
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // --------------------------------------------------------
    // Check prediction
    // --------------------------------------------------------

    const [predictions] = await connection.query(
      `
      SELECT
        dp.prediction_id,
        dp.severity,
        dp.affected_population,
        dp.disaster_event_id,
        de.disaster_type_id,
        de.state_id
      FROM disaster_predictions dp
      JOIN disaster_events de
        ON de.disaster_event_id = dp.disaster_event_id
      WHERE dp.prediction_id = ?
      LIMIT 1
      `,
      [predictionId]
    );

    if (predictions.length === 0) {
      throw new Error(
        `Prediction ${predictionId} not found`
      );
    }

    const prediction = predictions[0];

    // --------------------------------------------------------
    // Validate destination state
    // --------------------------------------------------------

    if (
      stateId === undefined ||
      stateId === null
    ) {
      stateId = prediction.state_id;
    }

    // --------------------------------------------------------
    // Get shortage quantities
    // --------------------------------------------------------

    const [shortages] = await connection.query(
      `
      SELECT
        prr.resource_id,
        r.resource_name,
        r.unit,
        prr.quantity_required,
        prr.quantity_available,
        prr.quantity_shortage
      FROM predicted_resource_requirements prr
      JOIN resources r
        ON r.resource_id = prr.resource_id
      WHERE prr.prediction_id = ?
        AND prr.quantity_shortage > 0
      ORDER BY prr.resource_id
      `,
      [predictionId]
    );

    // --------------------------------------------------------
    // No shortage
    // --------------------------------------------------------

    if (shortages.length === 0) {
      await connection.rollback();

      return {
        requestCreated: false,
        message: "No resource shortage exists",
        predictionId,
        shortages: []
      };
    }

    // --------------------------------------------------------
    // Create resource request
    // --------------------------------------------------------

    const [requestResult] = await connection.query(
      `
      INSERT INTO resource_requests
      (
        prediction_id,
        requested_by,
        state_id,
        request_status,
        priority,
        reason
      )
      VALUES (?, ?, ?, 'PENDING_STATE_APPROVAL', ?, ?)
      `,
      [
        predictionId,
        requestedBy,
        stateId,
        priority || "MEDIUM",
        reason || null
      ]
    );

    const requestId =
      requestResult.insertId;

    // --------------------------------------------------------
    // Insert requested resource items
    // --------------------------------------------------------

    for (const shortage of shortages) {
      await connection.query(
        `
        INSERT INTO resource_request_items
        (
          resource_request_id,
          resource_id,
          quantity_requested,
          quantity_approved
        )
        VALUES (?, ?, ?, 0)
        `,
        [
          requestId,
          shortage.resource_id,
          shortage.quantity_shortage
        ]
      );
    }

    await connection.commit();

    return {
      requestCreated: true,
      resourceRequestId: requestId,
      predictionId,
      stateId,
      priority: priority || "MEDIUM",
      shortages
    };

  } catch (error) {
    await connection.rollback();

    console.error(
      "Create shortage request service error:",
      error
    );

    throw error;

  } finally {
    connection.release();
  }
}


// ============================================================
// 2. GET ALL RESOURCE REQUESTS
// ============================================================

async function getAllRequests() {

  const [requests] = await pool.query(
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
      rr.updated_at,

      s.state_name,

      u.full_name AS requested_by_name,
      u.email AS requested_by_email,

      dp.probability,
      dp.severity,
      dp.expected_start_time,
      dp.expected_end_time,
      dp.affected_area_km2,
      dp.affected_population,

      de.disaster_event_id,
      de.event_name,

      dt.disaster_type_id,
      dt.disaster_name

    FROM resource_requests rr

    LEFT JOIN states s
      ON s.state_id = rr.state_id

    LEFT JOIN users u
      ON u.user_id = rr.requested_by

    LEFT JOIN disaster_predictions dp
      ON dp.prediction_id = rr.prediction_id

    LEFT JOIN disaster_events de
      ON de.disaster_event_id =
         dp.disaster_event_id

    LEFT JOIN disaster_types dt
      ON dt.disaster_type_id =
         de.disaster_type_id

    ORDER BY
      CASE rr.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END,
      rr.created_at DESC
    `
  );


  // ----------------------------------------------------------
  // Get items for every request
  // ----------------------------------------------------------

  for (const request of requests) {

    const [items] = await pool.query(
      `
      SELECT
        rri.request_item_id,
        rri.resource_id,
        rri.quantity_requested,
        rri.quantity_approved,

        r.resource_name,
        r.unit

      FROM resource_request_items rri

      JOIN resources r
        ON r.resource_id =
           rri.resource_id

      WHERE rri.resource_request_id = ?

      ORDER BY rri.request_item_id
      `,
      [request.resource_request_id]
    );

    request.items = items;
  }


  return requests;
}


// ============================================================
// 3. GET STATE HEAD PENDING REQUESTS
// ============================================================

async function getStatePendingRequests({
  stateId
}) {

  if (
    stateId === undefined ||
    stateId === null
  ) {
    throw new Error(
      "State ID is required"
    );
  }


  const [requests] = await pool.query(
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
      rr.updated_at,

      s.state_name,

      u.full_name AS requested_by_name,

      dp.probability,
      dp.severity,
      dp.expected_start_time,
      dp.expected_end_time,
      dp.affected_area_km2,
      dp.affected_population,

      de.event_name,

      dt.disaster_name

    FROM resource_requests rr

    LEFT JOIN states s
      ON s.state_id = rr.state_id

    LEFT JOIN users u
      ON u.user_id = rr.requested_by

    LEFT JOIN disaster_predictions dp
      ON dp.prediction_id =
         rr.prediction_id

    LEFT JOIN disaster_events de
      ON de.disaster_event_id =
         dp.disaster_event_id

    LEFT JOIN disaster_types dt
      ON dt.disaster_type_id =
         de.disaster_type_id

    WHERE rr.state_id = ?
      AND rr.request_status =
          'PENDING_STATE_APPROVAL'

    ORDER BY
      CASE rr.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END,
      rr.created_at ASC
    `,
    [stateId]
  );


  for (const request of requests) {

    const [items] = await pool.query(
      `
      SELECT
        rri.request_item_id,
        rri.resource_id,
        rri.quantity_requested,
        rri.quantity_approved,

        r.resource_name,
        r.unit

      FROM resource_request_items rri

      JOIN resources r
        ON r.resource_id =
           rri.resource_id

      WHERE rri.resource_request_id = ?

      ORDER BY rri.request_item_id
      `,
      [request.resource_request_id]
    );

    request.items = items;
  }


  return requests;
}


// ============================================================
// 4. STATE HEAD APPROVE
// ============================================================

async function approveByStateHead({
  requestId,
  approvingUserId
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------------
    // Get approving user
    // --------------------------------------------------------

    const [users] = await connection.query(
      `
      SELECT
        user_id,
        role_id,
        state_id
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [approvingUserId]
    );


    if (users.length === 0) {
      throw new Error(
        "Approving user not found"
      );
    }


    const user = users[0];


    // --------------------------------------------------------
    // Verify State Head
    // --------------------------------------------------------

    if (Number(user.role_id) !== 2) {
      throw new Error(
        "Only a State Head can approve this request"
      );
    }


    // --------------------------------------------------------
    // Get request
    // --------------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        resource_request_id,
        prediction_id,
        requested_by,
        state_id,
        request_status,
        priority
      FROM resource_requests
      WHERE resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );


    if (requests.length === 0) {
      throw new Error(
        `Resource request ${requestId} not found`
      );
    }


    const request = requests[0];


    // --------------------------------------------------------
    // Verify destination state
    //
    // IMPORTANT:
    // state_id represents the REQUESTING / DESTINATION STATE.
    //
    // It does NOT mean the source warehouse must belong
    // to this state.
    // --------------------------------------------------------

    if (
      Number(user.state_id) !==
      Number(request.state_id)
    ) {
      throw new Error(
        "State Head can approve only requests belonging to their state"
      );
    }


    // --------------------------------------------------------
    // Verify status
    // --------------------------------------------------------

    if (
      request.request_status !==
      "PENDING_STATE_APPROVAL"
    ) {
      throw new Error(
        `Request ${requestId} is not pending State Head approval`
      );
    }


    // --------------------------------------------------------
    // Update request
    // --------------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status =
          'PENDING_NATIONAL_APPROVAL'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------------
    // Record approval
    // --------------------------------------------------------

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
        approvingUserId,
        "Approved by State Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      previousStatus:
        "PENDING_STATE_APPROVAL",
      newStatus:
        "PENDING_NATIONAL_APPROVAL",
      approvedBy:
        approvingUserId
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "State Head approval service error:",
      error
    );

    throw error;

  } finally {
    connection.release();
  }
}


// ============================================================
// 5. STATE HEAD REJECT
// ============================================================

async function rejectByStateHead({
  requestId,
  approvingUserId,
  comments
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------------
    // Get user
    // --------------------------------------------------------

    const [users] = await connection.query(
      `
      SELECT
        user_id,
        role_id,
        state_id
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [approvingUserId]
    );


    if (users.length === 0) {
      throw new Error(
        "Approving user not found"
      );
    }


    const user = users[0];


    if (Number(user.role_id) !== 2) {
      throw new Error(
        "Only a State Head can reject this request"
      );
    }


    // --------------------------------------------------------
    // Get request
    // --------------------------------------------------------

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
      throw new Error(
        `Resource request ${requestId} not found`
      );
    }


    const request = requests[0];


    // --------------------------------------------------------
    // Verify state
    // --------------------------------------------------------

    if (
      Number(user.state_id) !==
      Number(request.state_id)
    ) {
      throw new Error(
        "State Head can reject only requests belonging to their state"
      );
    }


    // --------------------------------------------------------
    // Verify status
    // --------------------------------------------------------

    if (
      request.request_status !==
      "PENDING_STATE_APPROVAL"
    ) {
      throw new Error(
        `Request ${requestId} is not pending State Head approval`
      );
    }


    // --------------------------------------------------------
    // Reject
    // --------------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status =
          'STATE_REJECTED'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------------
    // Record rejection
    // --------------------------------------------------------

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
        approvingUserId,
        comments || "Rejected by State Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      previousStatus:
        "PENDING_STATE_APPROVAL",
      newStatus:
        "STATE_REJECTED",
      rejectedBy:
        approvingUserId
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "State Head rejection service error:",
      error
    );

    throw error;

  } finally {
    connection.release();
  }
}


// ============================================================
// 6. GET NATIONAL HEAD PENDING REQUESTS
// ============================================================

async function getNationalPendingRequests() {

  const [requests] = await pool.query(
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
      rr.updated_at,

      s.state_name,

      u.full_name AS requested_by_name,

      dp.probability,
      dp.severity,
      dp.expected_start_time,
      dp.expected_end_time,
      dp.affected_area_km2,
      dp.affected_population,

      de.event_name,

      dt.disaster_name

    FROM resource_requests rr

    LEFT JOIN states s
      ON s.state_id = rr.state_id

    LEFT JOIN users u
      ON u.user_id = rr.requested_by

    LEFT JOIN disaster_predictions dp
      ON dp.prediction_id =
         rr.prediction_id

    LEFT JOIN disaster_events de
      ON de.disaster_event_id =
         dp.disaster_event_id

    LEFT JOIN disaster_types dt
      ON dt.disaster_type_id =
         de.disaster_type_id

    WHERE rr.request_status =
          'PENDING_NATIONAL_APPROVAL'

    ORDER BY
      CASE rr.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
        ELSE 5
      END,
      rr.created_at ASC
    `
  );


  for (const request of requests) {

    const [items] = await pool.query(
      `
      SELECT
        rri.request_item_id,
        rri.resource_id,
        rri.quantity_requested,
        rri.quantity_approved,

        r.resource_name,
        r.unit

      FROM resource_request_items rri

      JOIN resources r
        ON r.resource_id =
           rri.resource_id

      WHERE rri.resource_request_id = ?

      ORDER BY rri.request_item_id
      `,
      [request.resource_request_id]
    );

    request.items = items;
  }


  return requests;
}


// ============================================================
// 7. NATIONAL HEAD APPROVE
// ============================================================

async function approveByNationalHead({
  requestId,
  approvingUserId
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------------
    // Verify National Head
    // --------------------------------------------------------

    const [users] = await connection.query(
      `
      SELECT
        user_id,
        role_id
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [approvingUserId]
    );


    if (users.length === 0) {
      throw new Error(
        "Approving user not found"
      );
    }


    const user = users[0];


    if (Number(user.role_id) !== 1) {
      throw new Error(
        "Only the National Head can approve this request"
      );
    }


    // --------------------------------------------------------
    // Get request
    // --------------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        resource_request_id,
        request_status,
        state_id
      FROM resource_requests
      WHERE resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );


    if (requests.length === 0) {
      throw new Error(
        `Resource request ${requestId} not found`
      );
    }


    const request = requests[0];


    // --------------------------------------------------------
    // Verify status
    // --------------------------------------------------------

    if (
      request.request_status !==
      "PENDING_NATIONAL_APPROVAL"
    ) {
      throw new Error(
        `Request ${requestId} is not pending National Head approval`
      );
    }


    // --------------------------------------------------------
    // Approve
    // --------------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status =
          'NATIONAL_APPROVED'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------------
    // Record approval
    // --------------------------------------------------------

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
      VALUES (?, ?, 'NATIONAL', 'APPROVED', ?)
      `,
      [
        requestId,
        approvingUserId,
        "Approved by National Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      previousStatus:
        "PENDING_NATIONAL_APPROVAL",
      newStatus:
        "NATIONAL_APPROVED",
      approvedBy:
        approvingUserId
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "National Head approval service error:",
      error
    );

    throw error;

  } finally {
    connection.release();
  }
}


// ============================================================
// 8. NATIONAL HEAD REJECT
// ============================================================

async function rejectByNationalHead({
  requestId,
  approvingUserId,
  comments
}) {

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();


    // --------------------------------------------------------
    // Verify National Head
    // --------------------------------------------------------

    const [users] = await connection.query(
      `
      SELECT
        user_id,
        role_id
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [approvingUserId]
    );


    if (users.length === 0) {
      throw new Error(
        "Approving user not found"
      );
    }


    const user = users[0];


    if (Number(user.role_id) !== 1) {
      throw new Error(
        "Only the National Head can reject this request"
      );
    }


    // --------------------------------------------------------
    // Get request
    // --------------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        resource_request_id,
        request_status
      FROM resource_requests
      WHERE resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );


    if (requests.length === 0) {
      throw new Error(
        `Resource request ${requestId} not found`
      );
    }


    const request = requests[0];


    // --------------------------------------------------------
    // Verify status
    // --------------------------------------------------------

    if (
      request.request_status !==
      "PENDING_NATIONAL_APPROVAL"
    ) {
      throw new Error(
        `Request ${requestId} is not pending National Head approval`
      );
    }


    // --------------------------------------------------------
    // Reject
    // --------------------------------------------------------

    await connection.query(
      `
      UPDATE resource_requests
      SET request_status =
          'NATIONAL_REJECTED'
      WHERE resource_request_id = ?
      `,
      [requestId]
    );


    // --------------------------------------------------------
    // Record rejection
    // --------------------------------------------------------

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
      VALUES (?, ?, 'NATIONAL', 'REJECTED', ?)
      `,
      [
        requestId,
        approvingUserId,
        comments || "Rejected by National Head"
      ]
    );


    await connection.commit();


    return {
      requestId,
      previousStatus:
        "PENDING_NATIONAL_APPROVAL",
      newStatus:
        "NATIONAL_REJECTED",
      rejectedBy:
        approvingUserId
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "National Head rejection service error:",
      error
    );

    throw error;

  } finally {
    connection.release();
  }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  createShortageRequest,

  getAllRequests,

  getStatePendingRequests,

  getNationalPendingRequests,

  approveByStateHead,

  rejectByStateHead,

  approveByNationalHead,

  rejectByNationalHead

};
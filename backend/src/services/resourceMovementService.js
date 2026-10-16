const pool = require("../config/database");
const crypto = require("crypto");

const {
  recordAudit
} = require("./blockchainService");


/**
 * Update the status of a resource movement.
 *
 * Valid transitions:
 *
 * PLANNED     -> DISPATCHED
 * DISPATCHED  -> IN_TRANSIT
 * IN_TRANSIT  -> DELIVERED
 *
 * DELIVERED has no further transition.
 */
async function updateMovementStatus({
  movementId,
  newStatus,
  userId,
  userRole
}) {
  const connection = await pool.getConnection();

  try {
    // =========================================================
    // 1. START DATABASE TRANSACTION
    // =========================================================

    await connection.beginTransaction();


    // =========================================================
    // 2. GET MOVEMENT AND LOCK THE ROW
    // =========================================================

    const [movementRows] = await connection.query(
      `
      SELECT
        rm.movement_id,
        rm.allocation_id,
        rm.from_warehouse_id,
        rm.to_state_id,
        rm.to_district_id,
        rm.resource_id,
        rm.quantity,
        rm.movement_status,
        rm.tracking_reference,

        ra.resource_request_id,
        ra.allocation_status,

        rr.request_status

      FROM resource_movements rm

      JOIN resource_allocations ra
        ON ra.allocation_id = rm.allocation_id

      JOIN resource_requests rr
        ON rr.resource_request_id = ra.resource_request_id

      WHERE rm.movement_id = ?

      FOR UPDATE
      `,
      [movementId]
    );


    // =========================================================
    // 3. CHECK MOVEMENT EXISTS
    // =========================================================

    if (movementRows.length === 0) {
      throw new Error(
        `Movement ${movementId} not found`
      );
    }


    const movement = movementRows[0];

    const currentStatus =
      movement.movement_status;


    // =========================================================
    // 4. VALIDATE STATUS TRANSITION
    // =========================================================

    const validTransitions = {
      PLANNED: ["DISPATCHED"],
      DISPATCHED: ["IN_TRANSIT"],
      IN_TRANSIT: ["DELIVERED"],
      DELIVERED: []
    };


    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      throw new Error(
        `Invalid movement transition: ${currentStatus} → ${newStatus}`
      );
    }


    // =========================================================
    // 5. DISPATCH MOVEMENT
    // =========================================================

    if (newStatus === "DISPATCHED") {

      // -------------------------------------------------------
      // Lock warehouse inventory
      // -------------------------------------------------------

      const [inventoryRows] =
        await connection.query(
          `
          SELECT
            warehouse_resource_id,
            quantity_available,
            quantity_reserved

          FROM warehouse_resources

          WHERE warehouse_id = ?
            AND resource_id = ?

          FOR UPDATE
          `,
          [
            movement.from_warehouse_id,
            movement.resource_id
          ]
        );


      if (inventoryRows.length === 0) {
        throw new Error(
          `Inventory not found for warehouse ${movement.from_warehouse_id}`
        );
      }


      const inventory =
        inventoryRows[0];


      const available =
        Number(inventory.quantity_available);

      const reserved =
        Number(inventory.quantity_reserved);

      const quantity =
        Number(movement.quantity);


      // -------------------------------------------------------
      // The allocation should already have reserved this stock
      // -------------------------------------------------------

      if (reserved < quantity) {
        throw new Error(
          `Insufficient reserved inventory. Reserved: ${reserved}, Required: ${quantity}`
        );
      }


      // -------------------------------------------------------
      // Check physical inventory
      // -------------------------------------------------------

      if (available < quantity) {
        throw new Error(
          `Insufficient inventory. Available: ${available}, Required: ${quantity}`
        );
      }


      // -------------------------------------------------------
      // Remove dispatched quantity from inventory
      // -------------------------------------------------------

      await connection.query(
        `
        UPDATE warehouse_resources

        SET
          quantity_available =
            quantity_available - ?,

          quantity_reserved =
            quantity_reserved - ?

        WHERE warehouse_id = ?
          AND resource_id = ?
        `,
        [
          quantity,
          quantity,
          movement.from_warehouse_id,
          movement.resource_id
        ]
      );


      // -------------------------------------------------------
      // Generate tracking reference
      // -------------------------------------------------------

      const trackingReference =
        movement.tracking_reference ||
        `RM-${Date.now()}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`;


      // -------------------------------------------------------
      // Update movement
      // -------------------------------------------------------

      await connection.query(
        `
        UPDATE resource_movements

        SET
          movement_status = 'DISPATCHED',
          dispatched_at = NOW(),
          tracking_reference = ?

        WHERE movement_id = ?
        `,
        [
          trackingReference,
          movementId
        ]
      );


      // Update local object so blockchain receives
      // the newly generated tracking reference.
      movement.tracking_reference =
        trackingReference;
    }


    // =========================================================
    // 6. MARK MOVEMENT IN TRANSIT
    // =========================================================

    if (newStatus === "IN_TRANSIT") {

      await connection.query(
        `
        UPDATE resource_movements

        SET
          movement_status = 'IN_TRANSIT'

        WHERE movement_id = ?
        `,
        [movementId]
      );
    }


    // =========================================================
    // 7. MARK MOVEMENT DELIVERED
    // =========================================================

    if (newStatus === "DELIVERED") {

      await connection.query(
        `
        UPDATE resource_movements

        SET
          movement_status = 'DELIVERED',
          delivered_at = NOW()

        WHERE movement_id = ?
        `,
        [movementId]
      );
    }


    // =========================================================
    // 8. CALCULATE OVERALL ALLOCATION STATUS
    // =========================================================

    const [movementStatusRows] =
      await connection.query(
        `
        SELECT
          movement_status,
          COUNT(*) AS count

        FROM resource_movements

        WHERE allocation_id = ?

        GROUP BY movement_status
        `,
        [movement.allocation_id]
      );


    const statuses = {};


    for (const row of movementStatusRows) {
      statuses[row.movement_status] =
        Number(row.count);
    }


    // =========================================================
    // 9. GET TOTAL MOVEMENTS
    // =========================================================

    const [movementCountRows] =
      await connection.query(
        `
        SELECT
          COUNT(*) AS total

        FROM resource_movements

        WHERE allocation_id = ?
        `,
        [movement.allocation_id]
      );


    const totalMovements =
      Number(movementCountRows[0].total);


    // =========================================================
    // 10. DETERMINE ALLOCATION STATUS
    // =========================================================

    let allocationStatus = "PLANNED";


    // ---------------------------------------------------------
    // All movements delivered
    // ---------------------------------------------------------

    if (
      statuses.DELIVERED === totalMovements &&
      totalMovements > 0
    ) {

      allocationStatus = "DELIVERED";

    }


    // ---------------------------------------------------------
    // All movements in transit
    // ---------------------------------------------------------

    else if (
      statuses.IN_TRANSIT === totalMovements
    ) {

      allocationStatus = "IN_TRANSIT";

    }


    // ---------------------------------------------------------
    // At least one movement has started
    // ---------------------------------------------------------

    else if (
      statuses.DISPATCHED === totalMovements ||
      (statuses.IN_TRANSIT || 0) > 0 ||
      (statuses.DELIVERED || 0) > 0
    ) {

      allocationStatus = "DISPATCHED";

    }


    // =========================================================
    // 11. UPDATE RESOURCE ALLOCATION
    // =========================================================

    await connection.query(
      `
      UPDATE resource_allocations

      SET
        allocation_status = ?

      WHERE allocation_id = ?
      `,
      [
        allocationStatus,
        movement.allocation_id
      ]
    );


    // =========================================================
    // 12. COMPLETE REQUEST WHEN EVERYTHING IS DELIVERED
    // =========================================================

    if (allocationStatus === "DELIVERED") {

      await connection.query(
        `
        UPDATE resource_requests

        SET
          request_status = 'COMPLETED'

        WHERE resource_request_id = ?

          AND request_status = 'ALLOCATED'
        `,
        [movement.resource_request_id]
      );
    }


    // =========================================================
    // 13. COMMIT DATABASE TRANSACTION
    // =========================================================

    await connection.commit();


    // =========================================================
    // 14. BLOCKCHAIN AUDIT
    // =========================================================
    //
    // IMPORTANT:
    // The database transaction has already been committed.
    //
    // Blockchain failure should NOT undo the successful
    // database status transition.
    // =========================================================

    let blockchainAudit = null;


    const blockchainEventData = {

      movementId,

      allocationId:
        movement.allocation_id,

      requestId:
        movement.resource_request_id,

      warehouseId:
        movement.from_warehouse_id,

      resourceId:
        movement.resource_id,

      quantity:
        Number(movement.quantity),

      previousStatus:
        currentStatus,

      newStatus,

      trackingReference:
        movement.tracking_reference || null,

      userId:
        userId || null,

      userRole:
        userRole || null
    };


    try {
      if (newStatus === "DISPATCHED") {
        blockchainAudit =
          await recordAudit({
            entityType:
              "RESOURCE_MOVEMENT",
            entityId:
              movementId,
            eventType:
              "RESOURCE_DISPATCHED",
            data:
              blockchainEventData
          });
      }

      if (newStatus === "IN_TRANSIT") {
        blockchainAudit =
          await recordAudit({
            entityType:
              "RESOURCE_MOVEMENT",
            entityId:
              movementId,
            eventType:
              "RESOURCE_IN_TRANSIT",
            data:
              blockchainEventData
          });
      }

      if (newStatus === "DELIVERED") {
        blockchainAudit =
          await recordAudit({
            entityType:
              "RESOURCE_MOVEMENT",
            entityId:
              movementId,
            eventType:
              "RESOURCE_DELIVERED",
            data:
              blockchainEventData
          });
      }
    } catch (bcError) {
      console.error("Non-fatal blockchain audit error:", bcError.message);
      blockchainAudit = {
        success: false,
        error: bcError.message
      };
    }


    // =========================================================
    // 18. RETURN RESULT
    // =========================================================

    return {

      success: true,

      movementId,

      previousStatus:
        currentStatus,

      newStatus,

      allocationId:
        movement.allocation_id,

      allocationStatus,

      requestId:
        movement.resource_request_id,

      requestStatus:
        allocationStatus === "DELIVERED"
          ? "COMPLETED"
          : movement.request_status,

      blockchainAudit
    };


  } catch (error) {

    // =========================================================
    // ROLLBACK DATABASE TRANSACTION
    // =========================================================

    await connection.rollback();

    throw error;

  } finally {

    // =========================================================
    // RELEASE CONNECTION
    // =========================================================

    connection.release();
  }
}


/**
 * Get all movements belonging to an allocation.
 */
async function getAllocationMovements(
  allocationId
) {

  const [rows] =
    await pool.query(
      `
      SELECT

        rm.movement_id,

        rm.allocation_id,

        rm.from_warehouse_id,

        w.warehouse_name,

        rm.to_state_id,

        s.state_name,

        rm.to_district_id,

        rm.resource_id,

        r.resource_name,

        r.unit,

        rm.quantity,

        rm.movement_status,

        rm.dispatched_at,

        rm.delivered_at,

        rm.tracking_reference,

        rm.created_at

      FROM resource_movements rm

      JOIN warehouses w
        ON w.warehouse_id =
           rm.from_warehouse_id

      JOIN states s
        ON s.state_id =
           rm.to_state_id

      JOIN resources r
        ON r.resource_id =
           rm.resource_id

      WHERE rm.allocation_id = ?

      ORDER BY rm.movement_id
      `,
      [allocationId]
    );


  return rows;
}


// ===========================================================
// EXPORTS
// ===========================================================

module.exports = {

  updateMovementStatus,

  getAllocationMovements

};
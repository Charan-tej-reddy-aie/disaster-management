require("dotenv").config();
const pool = require("../config/database");
const { recordAudit } = require("../services/blockchainService");

async function repairMovement7Blockchain() {
  try {
    const movementId = 7;

    // =====================================================
    // 1. Get movement information
    // =====================================================

    const [rows] = await pool.query(
      `
      SELECT
        rm.movement_id,
        rm.allocation_id,
        rm.from_warehouse_id,
        rm.resource_id,
        rm.quantity,
        rm.movement_status,
        rm.tracking_reference,
        ra.resource_request_id

      FROM resource_movements rm

      JOIN resource_allocations ra
        ON ra.allocation_id = rm.allocation_id

      WHERE rm.movement_id = ?
      `,
      [movementId]
    );

    if (rows.length === 0) {
      throw new Error(
        `Movement ${movementId} not found`
      );
    }

    const movement = rows[0];

    console.log("\nMovement found:");
    console.log(movement);


    // =====================================================
    // 2. Verify movement is already delivered
    // =====================================================

    if (movement.movement_status !== "DELIVERED") {
      throw new Error(
        `Movement ${movementId} is ${movement.movement_status}, not DELIVERED`
      );
    }


    // =====================================================
    // 3. Check whether blockchain audit already exists
    // =====================================================

    const [existing] = await pool.query(
      `
      SELECT
        blockchain_transaction_id,
        transaction_hash,
        transaction_status

      FROM blockchain_transactions

      WHERE entity_type = 'RESOURCE_MOVEMENT'
        AND entity_id = ?

      ORDER BY blockchain_transaction_id DESC
      `,
      [movementId]
    );


    if (existing.length > 0) {

      console.log(
        "\nBlockchain transaction already exists:"
      );

      console.table(existing);

      process.exit(0);
    }


    // =====================================================
    // 4. Create blockchain audit
    // =====================================================

    const auditData = {

      movementId:
        movement.movement_id,

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
        "IN_TRANSIT",

      newStatus:
        "DELIVERED",

      trackingReference:
        movement.tracking_reference || null,

      repair:
        true
    };


    console.log(
      "\nCreating blockchain audit..."
    );

    console.log(
      JSON.stringify(
        auditData,
        null,
        2
      )
    );


    const blockchainAudit =
      await recordAudit({

        entityType:
          "RESOURCE_MOVEMENT",

        entityId:
          movementId,

        eventType:
          "RESOURCE_DELIVERED",

        data:
          auditData
      });


    // =====================================================
    // 5. Display result
    // =====================================================

    console.log(
      "\n========================================"
    );

    console.log(
      "BLOCKCHAIN REPAIR SUCCESSFUL"
    );

    console.log(
      "========================================"
    );

    console.log(
      JSON.stringify(
        blockchainAudit,
        null,
        2
      )
    );


  } catch (error) {

    console.error(
      "\nBLOCKCHAIN REPAIR FAILED"
    );

    console.error(
      error.message
    );

    console.error(
      error
    );

    process.exitCode = 1;

  } finally {

    await pool.end();
  }
}


repairMovement7Blockchain();
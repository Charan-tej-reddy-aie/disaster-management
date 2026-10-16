const pool = require("../config/database");


// ======================================================
// CREATE RESOURCE ALLOCATION
// ======================================================

async function createResourceAllocation({
  requestId,
  allocatedBy
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // --------------------------------------------------
    // 1. Get and lock the approved request
    // --------------------------------------------------

    const [requests] = await connection.query(
      `
      SELECT
        rr.resource_request_id,
        rr.state_id,
        rr.request_status,
        rr.priority
      FROM resource_requests rr
      WHERE rr.resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );

    if (requests.length === 0) {
      throw new Error("Resource request not found");
    }

    const request = requests[0];


    // --------------------------------------------------
    // 2. Verify request status
    // --------------------------------------------------

    if (request.request_status !== "NATIONAL_APPROVED") {
      throw new Error(
        `Request must be NATIONAL_APPROVED before allocation. Current status: ${request.request_status}`
      );
    }


    // --------------------------------------------------
    // 3. Get requested resource quantities
    // --------------------------------------------------

    const [requestItems] = await connection.query(
      `
      SELECT
        ri.resource_id,
        r.resource_name,
        r.unit,
        ri.quantity_requested,
        ri.quantity_approved
      FROM resource_request_items ri
      JOIN resources r
        ON r.resource_id = ri.resource_id
      WHERE ri.resource_request_id = ?
      ORDER BY ri.resource_id
      `,
      [requestId]
    );

    if (requestItems.length === 0) {
      throw new Error(
        "No resource items found for this request"
      );
    }


    // --------------------------------------------------
    // 4. Check for existing active allocation
    // --------------------------------------------------

    const [existingAllocations] = await connection.query(
      `
      SELECT
        allocation_id,
        allocation_status
      FROM resource_allocations
      WHERE resource_request_id = ?
        AND allocation_status <> 'CANCELLED'
      `,
      [requestId]
    );

    if (existingAllocations.length > 0) {
      throw new Error(
        `Allocation already exists for this request. Allocation ID: ${existingAllocations[0].allocation_id}`
      );
    }


    // --------------------------------------------------
    // 5. Create allocation header
    // --------------------------------------------------

    const [allocationResult] = await connection.query(
      `
      INSERT INTO resource_allocations
      (
        resource_request_id,
        optimization_run_id,
        allocated_by,
        allocation_status
      )
      VALUES (?, NULL, ?, 'PLANNED')
      `,
      [
        requestId,
        allocatedBy
      ]
    );

    const allocationId =
      allocationResult.insertId;


    const allocationItems = [];
    const movementItems = [];

    let totalRequested = 0;
    let totalAllocated = 0;


    // ==================================================
    // 6. Allocate every requested resource
    // ==================================================

    for (const item of requestItems) {

      const requiredQuantity =
        Number(
          item.quantity_approved > 0
            ? item.quantity_approved
            : item.quantity_requested
        );

      totalRequested += requiredQuantity;


      if (requiredQuantity <= 0) {
        continue;
      }


      // ------------------------------------------------
      // Find warehouses containing this resource
      //
      // Same-state warehouses are considered first.
      // Other state warehouses are considered after that.
      // ------------------------------------------------

      const [warehouses] = await connection.query(
        `
        SELECT
          wr.warehouse_resource_id,
          wr.warehouse_id,
          w.state_id,
          w.district_id,
          w.warehouse_name,
          w.latitude,
          w.longitude,

          wr.quantity_available,
          wr.quantity_reserved,

          GREATEST(
            wr.quantity_available - wr.quantity_reserved,
            0
          ) AS usable_quantity

        FROM warehouse_resources wr

        JOIN warehouses w
          ON w.warehouse_id = wr.warehouse_id

        WHERE wr.resource_id = ?
          AND GREATEST(
            wr.quantity_available - wr.quantity_reserved,
            0
          ) > 0

        ORDER BY
          CASE
            WHEN w.state_id = ? THEN 0
            ELSE 1
          END,
          usable_quantity DESC,
          w.warehouse_id ASC

        FOR UPDATE
        `,
        [
          item.resource_id,
          request.state_id
        ]
      );


      let remainingQuantity =
        requiredQuantity;


      // ------------------------------------------------
      // Allocate from warehouses
      // ------------------------------------------------

      for (const warehouse of warehouses) {

        if (remainingQuantity <= 0) {
          break;
        }


        const usableQuantity =
          Number(warehouse.usable_quantity);


        if (usableQuantity <= 0) {
          continue;
        }


        const quantityAllocated =
          Math.min(
            remainingQuantity,
            usableQuantity
          );


        // ----------------------------------------------
        // Create allocation item
        // ----------------------------------------------

        await connection.query(
          `
          INSERT INTO resource_allocation_items
          (
            allocation_id,
            resource_id,
            warehouse_id,
            quantity_allocated
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            allocationId,
            item.resource_id,
            warehouse.warehouse_id,
            quantityAllocated
          ]
        );


        // ----------------------------------------------
        // Reserve warehouse inventory
        // ----------------------------------------------

        await connection.query(
          `
          UPDATE warehouse_resources
          SET quantity_reserved =
              quantity_reserved + ?
          WHERE warehouse_resource_id = ?
          `,
          [
            quantityAllocated,
            warehouse.warehouse_resource_id
          ]
        );


        // ----------------------------------------------
        // Prepare movement
        // ----------------------------------------------

        movementItems.push({
          warehouseId: warehouse.warehouse_id,
          resourceId: item.resource_id,
          quantity: quantityAllocated
        });


        allocationItems.push({
          resourceId: item.resource_id,
          resourceName: item.resource_name,
          unit: item.unit,
          warehouseId: warehouse.warehouse_id,
          warehouseName: warehouse.warehouse_name,
          quantityAllocated
        });


        remainingQuantity -=
          quantityAllocated;

        totalAllocated +=
          quantityAllocated;
      }


      // ------------------------------------------------
      // Check whether requirement was fulfilled
      // ------------------------------------------------

      if (remainingQuantity > 0) {

        allocationItems.push({
          resourceId: item.resource_id,
          resourceName: item.resource_name,
          unit: item.unit,
          warehouseId: null,
          warehouseName: null,
          quantityAllocated: 0,
          shortage: remainingQuantity
        });

      }

    }


    // ==================================================
    // 7. Determine allocation status
    // ==================================================

    const allFulfilled =
      totalAllocated >= totalRequested;


    // --------------------------------------------------
    // If everything is fulfilled:
    // request → ALLOCATED
    //
    // Otherwise:
    // request remains NATIONAL_APPROVED
    // allocation remains PLANNED
    // --------------------------------------------------

    if (allFulfilled) {

      await connection.query(
        `
        UPDATE resource_requests
        SET request_status = 'ALLOCATED'
        WHERE resource_request_id = ?
        `,
        [requestId]
      );

    }


    // ==================================================
    // 8. Create movement records
    // ==================================================

    for (const movement of movementItems) {

      await connection.query(
        `
        INSERT INTO resource_movements
        (
          allocation_id,
          from_warehouse_id,
          to_state_id,
          to_district_id,
          resource_id,
          quantity,
          movement_status
        )
        VALUES (?, ?, ?, NULL, ?, ?, 'PLANNED')
        `,
        [
          allocationId,
          movement.warehouseId,
          request.state_id,
          movement.resourceId,
          movement.quantity
        ]
      );

    }


    await connection.commit();


    return {
      allocationId,
      requestId,
      allocationStatus: "PLANNED",
      requestStatus: allFulfilled
        ? "ALLOCATED"
        : "NATIONAL_APPROVED",
      totalRequested,
      totalAllocated,
      fullyAllocated: allFulfilled,
      items: allocationItems
    };


  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();

  }
}

async function createQuantumAllocationFromRun({
  requestId,
  optimizationRunId,
  allocatedBy
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // ---------------------------------------------------------
    // 1. Get and lock the resource request
    // ---------------------------------------------------------
    const [requestRows] = await connection.query(
      `
      SELECT
        rr.resource_request_id,
        rr.request_status,
        rr.priority,
        rr.state_id,
        rr.prediction_id
      FROM resource_requests rr
      WHERE rr.resource_request_id = ?
      FOR UPDATE
      `,
      [requestId]
    );

    if (requestRows.length === 0) {
      throw new Error("Resource request not found");
    }

    const request = requestRows[0];

    // Quantum allocation should happen only after
    // National Head approval.
    if (request.request_status !== "NATIONAL_APPROVED") {
      throw new Error(
        `Request ${requestId} is not NATIONAL_APPROVED. Current status: ${request.request_status}`
      );
    }

    // ---------------------------------------------------------
    // 2. Prevent duplicate active allocation
    // ---------------------------------------------------------
    const [existingAllocations] = await connection.query(
      `
      SELECT allocation_id
      FROM resource_allocations
      WHERE resource_request_id = ?
        AND allocation_status IN
          ('PLANNED', 'APPROVED', 'DISPATCHED', 'IN_TRANSIT')
      LIMIT 1
      `,
      [requestId]
    );

    if (existingAllocations.length > 0) {
      throw new Error(
        `Active allocation already exists for request ${requestId}`
      );
    }

    // ---------------------------------------------------------
    // 3. Get the quantum optimization run
    // ---------------------------------------------------------
    const [runRows] = await connection.query(
      `
      SELECT
        optimization_run_id,
        resource_request_id,
        algorithm_name,
        algorithm_version,
        status,
        output_data
      FROM optimization_runs
      WHERE optimization_run_id = ?
        AND resource_request_id = ?
      FOR UPDATE
      `,
      [optimizationRunId, requestId]
    );

    if (runRows.length === 0) {
      throw new Error(
        `Optimization run ${optimizationRunId} does not belong to request ${requestId}`
      );
    }

    const optimizationRun = runRows[0];

    if (optimizationRun.status !== "COMPLETED") {
      throw new Error(
        `Optimization run ${optimizationRunId} is not COMPLETED`
      );
    }

    // ---------------------------------------------------------
    // 4. Parse quantum output
    // ---------------------------------------------------------
    let outputData = optimizationRun.output_data;

    if (typeof outputData === "string") {
      outputData = JSON.parse(outputData);
    }

    if (!outputData || !Array.isArray(outputData.resources)) {
      throw new Error(
        "Invalid quantum optimization output: resources array missing"
      );
    }

    // ---------------------------------------------------------
    // 5. Create actual resource allocation
    // ---------------------------------------------------------
    const [allocationResult] = await connection.query(
      `
      INSERT INTO resource_allocations
      (
        resource_request_id,
        optimization_run_id,
        allocated_by,
        allocation_status
      )
      VALUES (?, ?, ?, 'PLANNED')
      `,
      [
        requestId,
        optimizationRunId,
        allocatedBy
      ]
    );

    const allocationId = allocationResult.insertId;

    let totalRequired = 0;
    let totalAllocated = 0;

    // ---------------------------------------------------------
    // 6. Process each optimized resource
    // ---------------------------------------------------------
    for (const resourceResult of outputData.resources) {

      const resourceId = Number(resourceResult.resource_id);

      const requiredQuantity = Number(
        resourceResult.required_quantity || 0
      );

      totalRequired += requiredQuantity;

      if (!Array.isArray(resourceResult.allocations)) {
        continue;
      }

      for (const allocation of resourceResult.allocations) {

        const warehouseId = Number(allocation.warehouse_id);
        const quantityAllocated = Number(
          allocation.quantity_allocated
        );

        if (
          !Number.isFinite(warehouseId) ||
          !Number.isFinite(resourceId) ||
          !Number.isFinite(quantityAllocated) ||
          quantityAllocated <= 0
        ) {
          throw new Error(
            "Invalid allocation data returned by quantum optimizer"
          );
        }

        // -----------------------------------------------------
        // 7. Lock current warehouse inventory
        // -----------------------------------------------------
        const [inventoryRows] = await connection.query(
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
            warehouseId,
            resourceId
          ]
        );

        if (inventoryRows.length === 0) {
          throw new Error(
            `No inventory record found for warehouse ${warehouseId}, resource ${resourceId}`
          );
        }

        const inventory = inventoryRows[0];

        const quantityAvailable = Number(
          inventory.quantity_available
        );

        const quantityReserved = Number(
          inventory.quantity_reserved
        );

        const usableQuantity =
          quantityAvailable - quantityReserved;

        // -----------------------------------------------------
        // 8. Validate quantum result against CURRENT inventory
        // -----------------------------------------------------
        if (quantityAllocated > usableQuantity) {
          throw new Error(
            `Quantum allocation exceeds current usable inventory. ` +
            `Warehouse ${warehouseId}, Resource ${resourceId}, ` +
            `Requested ${quantityAllocated}, Usable ${usableQuantity}`
          );
        }

        // -----------------------------------------------------
        // 9. Insert allocation item
        // -----------------------------------------------------
        await connection.query(
          `
          INSERT INTO resource_allocation_items
          (
            allocation_id,
            resource_id,
            warehouse_id,
            quantity_allocated
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            allocationId,
            resourceId,
            warehouseId,
            quantityAllocated
          ]
        );

        // -----------------------------------------------------
        // 10. Reserve inventory
        // -----------------------------------------------------
        await connection.query(
          `
          UPDATE warehouse_resources
          SET quantity_reserved =
              quantity_reserved + ?
          WHERE warehouse_id = ?
            AND resource_id = ?
          `,
          [
            quantityAllocated,
            warehouseId,
            resourceId
          ]
        );

        // -----------------------------------------------------
        // 11. Create planned movement
        // -----------------------------------------------------
        await connection.query(
          `
          INSERT INTO resource_movements
          (
            allocation_id,
            from_warehouse_id,
            to_state_id,
            to_district_id,
            resource_id,
            quantity,
            movement_status
          )
          VALUES (?, ?, ?, NULL, ?, ?, 'PLANNED')
          `,
          [
            allocationId,
            warehouseId,
            request.state_id,
            resourceId,
            quantityAllocated
          ]
        );

        totalAllocated += quantityAllocated;
      }
    }

    // ---------------------------------------------------------
    // 12. Determine shortage
    // ---------------------------------------------------------
    const totalShortage = Math.max(
      0,
      totalRequired - totalAllocated
    );

    // ---------------------------------------------------------
    // 13. Update request status
    // ---------------------------------------------------------
    if (totalShortage <= 0) {
      await connection.query(
        `
        UPDATE resource_requests
        SET request_status = 'ALLOCATED'
        WHERE resource_request_id = ?
        `,
        [requestId]
      );
    }

    // ---------------------------------------------------------
    // 14. Commit everything
    // ---------------------------------------------------------
    await connection.commit();

    return {
      success: true,
      requestId,
      optimizationRunId,
      allocationId,
      totalRequired,
      totalAllocated,
      totalShortage,
      requestStatus:
        totalShortage <= 0
          ? "ALLOCATED"
          : "NATIONAL_APPROVED"
    };

  } catch (error) {

    await connection.rollback();

    throw error;

  } finally {

    connection.release();
  }
}



module.exports = {
  createResourceAllocation,
  createQuantumAllocationFromRun
};
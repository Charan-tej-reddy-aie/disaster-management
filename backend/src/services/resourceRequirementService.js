const pool = require("../config/database");


/*
|--------------------------------------------------------------------------
| CALCULATE RESOURCE REQUIREMENTS
|--------------------------------------------------------------------------
|
| This function:
|
| 1. Gets prediction details
| 2. Finds matching resource requirement rules
| 3. Calculates required quantity
| 4. Checks warehouse inventory
| 5. Calculates available quantity
| 6. Calculates shortage
|
| IMPORTANT:
| This function DOES NOT modify the database.
|
*/

async function calculateResourceRequirements(predictionId) {

  // ---------------------------------------------------------
  // 1. Get prediction details
  // ---------------------------------------------------------

  const [predictionRows] = await pool.query(
    `
    SELECT
        dp.prediction_id,
        dp.probability,
        dp.severity,
        dp.affected_population,

        de.disaster_event_id,
        de.disaster_type_id,

        dt.disaster_name,

        de.state_id,
        s.state_name

    FROM disaster_predictions dp

    JOIN disaster_events de
        ON de.disaster_event_id = dp.disaster_event_id

    JOIN disaster_types dt
        ON dt.disaster_type_id = de.disaster_type_id

    JOIN states s
        ON s.state_id = de.state_id

    WHERE dp.prediction_id = ?
    `,
    [predictionId]
  );


  if (predictionRows.length === 0) {

    throw new Error(
      "Prediction not found"
    );

  }


  const prediction = predictionRows[0];


  // ---------------------------------------------------------
  // 2. Validate affected population
  // ---------------------------------------------------------

  const affectedPopulation = Number(
    prediction.affected_population || 0
  );


  if (affectedPopulation <= 0) {

    throw new Error(
      "Prediction does not contain a valid affected population"
    );

  }


  // ---------------------------------------------------------
  // 3. Find matching resource requirement rules
  // ---------------------------------------------------------

  const [rules] = await pool.query(
    `
    SELECT
        rrr.disaster_type_id,
        rrr.resource_id,
        rrr.severity,
        rrr.quantity_per_person,
        rrr.fixed_quantity,

        r.resource_name,
        r.unit

    FROM resource_requirement_rules rrr

    JOIN resources r
        ON r.resource_id = rrr.resource_id

    WHERE rrr.disaster_type_id = ?
      AND rrr.severity = ?

    ORDER BY r.resource_id
    `,
    [
      prediction.disaster_type_id,
      prediction.severity
    ]
  );


  // ---------------------------------------------------------
  // No matching rules
  // ---------------------------------------------------------

  if (rules.length === 0) {

    return {
      prediction,
      requirements: [],
      message:
        "No resource requirement rules configured for this disaster type and severity"
    };

  }


  // ---------------------------------------------------------
  // 4. Calculate requirements
  // ---------------------------------------------------------

  const requirements = [];


  for (const rule of rules) {

    let quantityRequired = 0;


    // -------------------------------------------------------
    // Quantity based on affected population
    // -------------------------------------------------------

    if (rule.quantity_per_person !== null) {

      quantityRequired =
        affectedPopulation *
        Number(rule.quantity_per_person);

    }


    // -------------------------------------------------------
    // Fixed quantity
    // -------------------------------------------------------

    else if (rule.fixed_quantity !== null) {

      quantityRequired =
        Number(rule.fixed_quantity);

    }


    quantityRequired = Number(
      quantityRequired.toFixed(3)
    );


    // -------------------------------------------------------
    // 5. Get inventory from all warehouses
    // -------------------------------------------------------

    const [inventoryRows] = await pool.query(
      `
      SELECT
          w.warehouse_id,
          w.warehouse_name,

          w.state_id,
          s.state_name,

          wr.quantity_available,
          wr.quantity_reserved,

          (
              wr.quantity_available -
              wr.quantity_reserved
          ) AS usable_quantity

      FROM warehouse_resources wr

      JOIN warehouses w
          ON w.warehouse_id = wr.warehouse_id

      JOIN states s
          ON s.state_id = w.state_id

      WHERE wr.resource_id = ?

      ORDER BY usable_quantity DESC
      `,
      [rule.resource_id]
    );


    // -------------------------------------------------------
    // 6. Calculate total usable inventory
    // -------------------------------------------------------

    const totalAvailable =
      inventoryRows.reduce(
        (total, row) =>
          total +
          Number(row.usable_quantity || 0),
        0
      );


    // -------------------------------------------------------
    // 7. Calculate shortage
    // -------------------------------------------------------

    const shortage = Math.max(
      quantityRequired -
      totalAvailable,
      0
    );


    // -------------------------------------------------------
    // 8. Add requirement to result
    // -------------------------------------------------------

    requirements.push({

      resource_id:
        rule.resource_id,

      resource_name:
        rule.resource_name,

      unit:
        rule.unit,

      quantity_required:
        quantityRequired,

      quantity_available:
        Number(
          totalAvailable.toFixed(3)
        ),

      quantity_shortage:
        Number(
          shortage.toFixed(3)
        ),

      inventory:
        inventoryRows.map((row) => ({

          warehouse_id:
            row.warehouse_id,

          warehouse_name:
            row.warehouse_name,

          state_id:
            row.state_id,

          state_name:
            row.state_name,

          quantity_available:
            Number(
              row.quantity_available
            ),

          quantity_reserved:
            Number(
              row.quantity_reserved
            ),

          usable_quantity:
            Number(
              row.usable_quantity
            )

        }))

    });

  }


  // ---------------------------------------------------------
  // 9. Return calculated requirements
  // ---------------------------------------------------------

  return {

    prediction,

    requirements

  };

}


/*
|--------------------------------------------------------------------------
| GENERATE / SAVE RESOURCE REQUIREMENTS
|--------------------------------------------------------------------------
|
| This function:
|
| 1. Calculates the resource requirements
| 2. Starts a database transaction
| 3. Removes previous generated requirements
| 4. Saves the latest calculated requirements
| 5. Commits the transaction
|
| This allows predictions such as Prediction #2,
| which currently has no rows in predicted_resource_requirements,
| to get their calculated requirements stored in the database.
|
*/

async function generateResourceRequirements(predictionId) {

  // ---------------------------------------------------------
  // 1. Calculate requirements first
  // ---------------------------------------------------------

  const result =
    await calculateResourceRequirements(
      predictionId
    );


  // ---------------------------------------------------------
  // 2. Make sure requirements exist
  // ---------------------------------------------------------

  if (
    !result.requirements ||
    result.requirements.length === 0
  ) {

    return {

      success: false,

      prediction:
        result.prediction,

      requirements: [],

      message:
        result.message ||
        "No resource requirements could be generated"

    };

  }


  // ---------------------------------------------------------
  // 3. Get database connection
  // ---------------------------------------------------------

  const connection =
    await pool.getConnection();


  try {

    // -------------------------------------------------------
    // 4. Start transaction
    // -------------------------------------------------------

    await connection.beginTransaction();


    // -------------------------------------------------------
    // 5. Remove previously generated requirements
    // -------------------------------------------------------
    //
    // This prevents duplicate rows if the user generates
    // requirements for the same prediction more than once.
    //
    // Existing resource requests are NOT deleted.
    //
    // -------------------------------------------------------

    await connection.query(
      `
      DELETE FROM predicted_resource_requirements
      WHERE prediction_id = ?
      `,
      [predictionId]
    );


    // -------------------------------------------------------
    // 6. Insert calculated requirements
    // -------------------------------------------------------

    const savedRequirements = [];


    for (
      const requirement
      of result.requirements
    ) {

      const [insertResult] =
        await connection.query(
          `
          INSERT INTO predicted_resource_requirements
          (
              prediction_id,
              resource_id,
              quantity_required,
              quantity_available,
              quantity_shortage
          )

          VALUES
          (?, ?, ?, ?, ?)
          `,
          [

            predictionId,

            requirement.resource_id,

            requirement.quantity_required,

            requirement.quantity_available,

            requirement.quantity_shortage

          ]
        );


      savedRequirements.push({

        predicted_requirement_id:
          insertResult.insertId,

        prediction_id:
          predictionId,

        resource_id:
          requirement.resource_id,

        resource_name:
          requirement.resource_name,

        unit:
          requirement.unit,

        quantity_required:
          requirement.quantity_required,

        quantity_available:
          requirement.quantity_available,

        quantity_shortage:
          requirement.quantity_shortage,

        inventory:
          requirement.inventory

      });

    }


    // -------------------------------------------------------
    // 7. Commit transaction
    // -------------------------------------------------------

    await connection.commit();


    // -------------------------------------------------------
    // 8. Return result
    // -------------------------------------------------------

    return {

      success: true,

      prediction:
        result.prediction,

      requirements:
        savedRequirements,

      message:
        "Resource requirements generated and saved successfully"

    };


  } catch (error) {

    // -------------------------------------------------------
    // Rollback if anything fails
    // -------------------------------------------------------

    await connection.rollback();

    throw error;


  } finally {

    // -------------------------------------------------------
    // Release connection
    // -------------------------------------------------------

    connection.release();

  }

}


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {

  calculateResourceRequirements,

  generateResourceRequirements

};
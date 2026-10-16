const pool = require("../config/database");


async function createOptimizationRun({
  requestId,
  algorithmName,
  algorithmVersion,
  inputData
}) {

  const [result] = await pool.query(
    `
    INSERT INTO optimization_runs
    (
      resource_request_id,
      algorithm_name,
      algorithm_version,
      status,
      input_data,
      started_at
    )
    VALUES (?, ?, ?, 'RUNNING', ?, NOW())
    `,
    [
      requestId,
      algorithmName,
      algorithmVersion,
      JSON.stringify(inputData)
    ]
  );

  return result.insertId;
}


async function completeOptimizationRun({
  optimizationRunId,
  objectiveValue,
  outputData
}) {

  await pool.query(
    `
    UPDATE optimization_runs
    SET
      status = 'COMPLETED',
      objective_value = ?,
      output_data = ?,
      completed_at = NOW()
    WHERE optimization_run_id = ?
    `,
    [
      objectiveValue,
      JSON.stringify(outputData),
      optimizationRunId
    ]
  );
}


async function failOptimizationRun({
  optimizationRunId,
  errorMessage
}) {

  await pool.query(
    `
    UPDATE optimization_runs
    SET
      status = 'FAILED',
      output_data = ?,
      completed_at = NOW()
    WHERE optimization_run_id = ?
    `,
    [
      JSON.stringify({
        error: errorMessage
      }),
      optimizationRunId
    ]
  );
}


module.exports = {
  createOptimizationRun,
  completeOptimizationRun,
  failOptimizationRun
};
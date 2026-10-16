const pool = require("../config/database");

const {
  recordAudit
} = require("./blockchainService");


async function recordBlockchainAudit({
  entityType,
  entityId,
  eventType,
  data
}) {

  try {

    // ---------------------------------------------------------
    // 1. Write audit event to blockchain
    // ---------------------------------------------------------

    const blockchainResult = await recordAudit({
      entityType,
      entityId,
      eventType,
      referenceId: `${entityType}_${entityId}`,
      data
    });

    console.log(
      `Blockchain audit recorded: ${eventType} → ${entityType} ${entityId}`
    );


    console.log(
      `Blockchain audit recorded: ${eventType} → ${entityType} ${entityId}`
    );


    return {
      success: true,
      eventType,
      entityType,
      entityId: Number(entityId),
      transactionHash:
        blockchainResult.transactionHash,
      blockNumber:
        blockchainResult.blockNumber,
      blockchainNetwork: "HARDHAT_LOCAL"
    };

  } catch (error) {

    console.error(
      `Blockchain audit failed for ${eventType}:`,
      error.message
    );

    // Blockchain failure should NOT break
    // the main disaster-management operation.
    return {
      success: false,
      eventType,
      entityType,
      entityId: Number(entityId),
      error: error.message
    };
  }
}


async function getBlockchainAuditForEntity({
  entityType,
  entityId
}) {

  const [rows] = await pool.query(
    `
    SELECT
      blockchain_transaction_id,
      entity_type,
      entity_id,
      transaction_hash,
      blockchain_network,
      block_number,
      transaction_status,
      recorded_at
    FROM blockchain_transactions
    WHERE entity_type = ?
      AND entity_id = ?
    ORDER BY blockchain_transaction_id ASC
    `,
    [
      entityType,
      Number(entityId)
    ]
  );

  return rows;
}


module.exports = {
  recordBlockchainAudit,
  getBlockchainAuditForEntity
};
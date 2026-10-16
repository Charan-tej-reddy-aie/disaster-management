const { ethers } = require("ethers");
const crypto = require("crypto");

const pool = require("../config/database");

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.DISASTER_AUDIT_CONTRACT;

const CONTRACT_ABI = [
  "function recordAudit(string eventType, string referenceId, bytes32 dataHash) external returns (uint256)",
  "function getAudit(uint256 recordId) external view returns (uint256,string,string,bytes32,uint256,address)",
  "event AuditRecorded(uint256 indexed recordId,string eventType,string referenceId,bytes32 dataHash,uint256 timestamp,address recordedBy)"
];

function getBlockchainContract() {

  if (!RPC_URL) {
    throw new Error("BLOCKCHAIN_RPC_URL is not configured");
  }

  if (!PRIVATE_KEY) {
    throw new Error("BLOCKCHAIN_PRIVATE_KEY is not configured");
  }

  if (!CONTRACT_ADDRESS) {
    throw new Error("DISASTER_AUDIT_CONTRACT is not configured");
  }

  const provider =
    new ethers.JsonRpcProvider(RPC_URL);

  const wallet =
    new ethers.Wallet(
      PRIVATE_KEY,
      provider
    );

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    wallet
  );
}


function createDataHash(data) {

  const canonicalData =
    typeof data === "string"
      ? data
      : JSON.stringify(data);

  const hash =
    crypto
      .createHash("sha256")
      .update(canonicalData)
      .digest("hex");

  return `0x${hash}`;
}


async function recordAudit({
  entityType,
  entityId,
  eventType,
  referenceId,
  data
}) {

  const contract =
    getBlockchainContract();

  const finalReferenceId =
    referenceId ||
    `${entityType}:${entityId}`;

  const dataHash =
    createDataHash(data);

  console.log("\n========== BLOCKCHAIN AUDIT ==========");
  console.log("Entity Type:", entityType);
  console.log("Entity ID:", entityId);
  console.log("Event:", eventType);
  console.log("Reference:", finalReferenceId);
  console.log("Data Hash:", dataHash);
  console.log("======================================\n");


  // =====================================================
  // 1. RECORD ON BLOCKCHAIN
  // =====================================================

  const transaction =
    await contract.recordAudit(
      eventType,
      String(finalReferenceId),
      dataHash
    );

  console.log(
    "Blockchain transaction:",
    transaction.hash
  );


  const receipt =
    await transaction.wait();


  let recordId = null;


  for (const log of receipt.logs) {

    try {

      const parsed =
        contract.interface.parseLog(log);

      if (
        parsed &&
        parsed.name === "AuditRecorded"
      ) {

        recordId =
          parsed.args.recordId.toString();

        break;
      }

    } catch (error) {

      // Ignore unrelated logs

    }
  }


  // =====================================================
  // 2. RECORD BLOCKCHAIN TRANSACTION IN MYSQL
  // =====================================================

  const [result] =
    await pool.query(
      `
      INSERT INTO blockchain_transactions
      (
        entity_type,
        entity_id,
        transaction_hash,
        blockchain_network,
        block_number,
        transaction_status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        entityType || "AUDIT",
        entityId && !isNaN(Number(entityId)) ? Number(entityId) : 0,
        transaction.hash,
        "HARDHAT_LOCAL",
        receipt.blockNumber,
        "CONFIRMED"
      ]
    );


  console.log(
    "MySQL blockchain transaction ID:",
    result.insertId
  );


  // =====================================================
  // 3. RETURN RESULT
  // =====================================================

  return {

    success: true,

    blockchainTransactionId:
      result.insertId,

    recordId,

    transactionHash:
      transaction.hash,

    blockNumber:
      receipt.blockNumber,

    contractAddress:
      CONTRACT_ADDRESS,

    entityType,

    entityId:
      Number(entityId),

    eventType,

    referenceId:
      String(finalReferenceId),

    dataHash

  };

}


async function getAudit(recordId) {

  const contract =
    getBlockchainContract();

  const result =
    await contract.getAudit(recordId);

  return {

    recordId:
      result[0].toString(),

    eventType:
      result[1],

    referenceId:
      result[2],

    dataHash:
      result[3],

    timestamp:
      result[4].toString(),

    recordedBy:
      result[5]

  };

}


module.exports = {
  recordAudit,
  getAudit,
  createDataHash
};
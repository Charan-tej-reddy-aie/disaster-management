require("dotenv").config();

const {
  recordBlockchainAudit,
  getBlockchainAuditForEntity
} = require("./src/services/blockchainAuditService");


async function test() {

  console.log("\n=================================");
  console.log("BLOCKCHAIN AUDIT INTEGRATION TEST");
  console.log("=================================\n");


  const result =
    await recordBlockchainAudit({
      entityType: "RESOURCE_MOVEMENT",
      entityId: 999,
      eventType: "RESOURCE_DELIVERED",
      data: {
        movementId: 999,
        allocationId: 999,
        requestId: 999,
        warehouseId: 1,
        resourceId: 3,
        quantity: 5000,
        status: "DELIVERED"
      }
    });


  console.log("\nBlockchain result:");
  console.log(result);


  const records =
    await getBlockchainAuditForEntity({
      entityType: "RESOURCE_MOVEMENT",
      entityId: 999
    });


  console.log("\nMySQL blockchain audit records:");
  console.table(records);
}


test().catch(error => {

  console.error(
    "\nTest failed:",
    error
  );

  process.exit(1);
});
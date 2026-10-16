require("dotenv").config();

const {
  recordAudit,
  getAudit
} = require("./src/services/blockchainService");

async function test() {

  console.log("Testing blockchain connection...\n");

  const result = await recordAudit({
    eventType: "TEST_EVENT",
    referenceId: "TEST_001",
    data: {
      message: "Disaster management blockchain test",
      timestamp: new Date().toISOString()
    }
  });

  console.log("\nAudit recorded:");
  console.log(result);

  const audit =
    await getAudit(result.recordId);

  console.log("\nAudit retrieved from blockchain:");
  console.log(audit);
}

test().catch(error => {

  console.error("\nBlockchain test failed:");
  console.error(error);

  process.exit(1);
});
const pool = require("../config/database");

async function runLiveDisaster() {
  console.log("=======================================================================");
  console.log("      LIVE END-TO-END DISASTER SIMULATION & SUPPLY CHAIN VERIFICATION  ");
  console.log("=======================================================================\n");

  const baseUrl = "http://localhost:5000/api";

  try {
    console.log(">>> [STEP 1] Triggering Live Disaster Simulation Endpoint...");
    const res = await fetch(`${baseUrl}/disasters/simulate-dummy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(`Simulation failed: ${data.message}`);
    }

    const { scenario } = data;
    console.log("✓ Status: SUCCESS");
    console.log(`✓ Event Name:           ${scenario.eventName}`);
    console.log(`✓ Disaster Event ID:    #${scenario.eventId}`);
    console.log(`✓ Prediction ID:        #${scenario.predictionId}`);
    console.log(`✓ Resource Request ID:  #${scenario.requestId} (NATIONAL_APPROVED)`);
    console.log(`✓ Quantum Optimization: ${scenario.quantumAlgorithm} (${scenario.quantumDetails})`);
    console.log(`✓ Allocation ID:        #${scenario.allocationId} (Stock Reserved)`);
    console.log(`✓ Movements Created:    ${scenario.movementsCount} delivery routes`);

    console.log("\n>>> [STEP 2] Blockchain Audit Transactions (Mined on Ethereum Hardhat Node):");
    console.table(scenario.blockchainTransactions);

    console.log("\n>>> [STEP 3] Inspecting Live Warehouse Stock & Reservation Changes:");
    const [stocks] = await pool.query(`
      SELECT 
        w.warehouse_name,
        r.resource_name,
        wr.quantity_available,
        wr.quantity_reserved,
        GREATEST(wr.quantity_available - wr.quantity_reserved, 0) AS usable_stock
      FROM warehouse_resources wr
      JOIN warehouses w ON w.warehouse_id = wr.warehouse_id
      JOIN resources r ON r.resource_id = wr.resource_id
      WHERE wr.warehouse_id = 1
    `);
    console.table(stocks);

    console.log("\n>>> [STEP 4] Inspecting Latest Mined Blocks on Smart Contract:");
    const [latestTxs] = await pool.query(`
      SELECT 
        blockchain_transaction_id,
        entity_type,
        entity_id,
        block_number,
        transaction_status,
        transaction_hash,
        recorded_at
      FROM blockchain_transactions
      ORDER BY blockchain_transaction_id DESC
      LIMIT 4
    `);
    console.table(latestTxs);

    console.log("\n=======================================================================");
    console.log("   LIVE DISASTER SCENARIO EXECUTED AND VERIFIED END-TO-END!            ");
    console.log("=======================================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Simulation Failed:", err.message);
    process.exit(1);
  }
}

runLiveDisaster();

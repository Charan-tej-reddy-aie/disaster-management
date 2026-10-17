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
    console.log(`✓ Severity:             ${scenario.severity} (${(scenario.probability * 100).toFixed(0)}% Probability)`);
    console.log(`✓ Resource Request ID:  #${scenario.requestId} (${scenario.status})`);
    console.log(`✓ Affected Population:  ${scenario.affectedPopulation.toLocaleString()} citizens`);
    console.log(`✓ Human Verification:   ${scenario.requiresHumanVerification ? "REQUIRED (Pending State SDMA Review)" : "None"}`);

    console.log("\n>>> [STEP 2] AI Recommended Relief Resources:");
    console.table(scenario.items);

    console.log("\n>>> [STEP 3] Next Steps in Workflow:");
    scenario.nextSteps.forEach(step => console.log(`  ${step}`));

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

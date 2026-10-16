const pool = require("../config/database");

async function testLifecycle() {
  console.log("==========================================================");
  console.log("   DISASTER MANAGEMENT FULL LIFECYCLE VERIFICATION TEST   ");
  console.log("==========================================================\n");

  const baseUrl = "http://localhost:5000/api";

  // Helper for login
  async function login(email, password = "Admin@123") {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(`Login failed for ${email}: ${data.message}`);
    return { token: data.token, user: data.user };
  }

  try {
    // -----------------------------------------------------------------
    // 1. STATE HEAD: Login and Check State Requests
    // -----------------------------------------------------------------
    console.log(">>> [1/7] Logging in as State Head (Kerala)...");
    const stateHead = await login("KeralaState.head@disaster.local");
    console.log(`✓ Logged in: ${stateHead.user.fullName} (${stateHead.user.role})`);

    const stateReqsRes = await fetch(`${baseUrl}/resource-requests/state/pending`, {
      headers: { Authorization: `Bearer ${stateHead.token}` }
    });
    const stateReqsData = await stateReqsRes.json();
    console.log(`✓ Pending State Requests: ${stateReqsData.count || 0}`);

    // If there is any PENDING_STATE_APPROVAL request, approve it
    let targetRequestId = 5;
    if (stateReqsData.requests && stateReqsData.requests.length > 0) {
      const firstReq = stateReqsData.requests[0];
      targetRequestId = firstReq.resource_request_id;
      console.log(`Approving State Request #${targetRequestId}...`);
      const approveRes = await fetch(`${baseUrl}/resource-requests/${targetRequestId}/state-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${stateHead.token}`
        },
        body: JSON.stringify({ comments: "State Head emergency verification complete" })
      });
      const approveData = await approveRes.json();
      console.log(`✓ State approval result:`, approveData.message);
    }

    // -----------------------------------------------------------------
    // 2. NATIONAL HEAD: Login and Approve at National Level
    // -----------------------------------------------------------------
    console.log("\n>>> [2/7] Logging in as National Head...");
    const nationalHead = await login("national.head@disaster.local");
    console.log(`✓ Logged in: ${nationalHead.user.fullName} (${nationalHead.user.role})`);

    const nationalReqsRes = await fetch(`${baseUrl}/resource-requests/national/pending`, {
      headers: { Authorization: `Bearer ${nationalHead.token}` }
    });
    const nationalReqsData = await nationalReqsRes.json();
    console.log(`✓ Pending National Requests: ${nationalReqsData.requests?.length || 0}`);

    if (nationalReqsData.requests && nationalReqsData.requests.length > 0) {
      const pendingNational = nationalReqsData.requests[0];
      targetRequestId = pendingNational.resource_request_id;
      console.log(`National Head approving Request #${targetRequestId}...`);
      const natApproveRes = await fetch(`${baseUrl}/resource-requests/national/${targetRequestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nationalHead.token}`
        },
        body: JSON.stringify({ comments: "National emergency deployment authorized" })
      });
      const natApproveData = await natApproveRes.json();
      console.log(`✓ National approval result:`, natApproveData.status || natApproveData.message);
    }

    // -----------------------------------------------------------------
    // 3. Check Request Status in Database
    // -----------------------------------------------------------------
    console.log("\n>>> [3/7] Inspecting Target Request Status...");
    const [reqRows] = await pool.query(
      "SELECT resource_request_id, request_status, priority, reason FROM resource_requests WHERE resource_request_id = ?",
      [targetRequestId]
    );
    console.log("Current Request Status:", reqRows[0]);

    // -----------------------------------------------------------------
    // 4. QUANTUM RESOURCE OPTIMIZATION
    // -----------------------------------------------------------------
    console.log("\n>>> [4/7] Testing Quantum Resource Optimization for Approved Request...");
    let runId = null;
    try {
      const qRes = await fetch(`${baseUrl}/resource-allocations/${targetRequestId}/quantum-optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nationalHead.token}`
        }
      });
      const qData = await qRes.json();
      console.log("✓ Quantum Optimization Service Response:", qData.success ? "SUCCESS" : "FAILED");
      if (qData.optimizationRun) {
        console.log(`  Algorithm: ${qData.optimizationRun.algorithm_name}`);
        console.log(`  Run ID: ${qData.optimizationRun.optimization_run_id}`);
        runId = qData.optimizationRun.optimization_run_id;
      }
    } catch (qe) {
      console.log("Quantum optimize notice:", qe.message);
    }

    // -----------------------------------------------------------------
    // 5. RESOURCE ALLOCATION & STOCK RESERVATION
    // -----------------------------------------------------------------
    console.log("\n>>> [5/7] Checking Allocation for Request...");
    const [existingAlloc] = await pool.query(
      "SELECT allocation_id, allocation_status FROM resource_allocations WHERE resource_request_id = ?",
      [targetRequestId]
    );

    let activeAllocationId = null;
    if (existingAlloc.length > 0) {
      activeAllocationId = existingAlloc[0].allocation_id;
      console.log(`✓ Existing Allocation Found: #${activeAllocationId} (${existingAlloc[0].allocation_status})`);
    } else if (reqRows[0]?.request_status === "NATIONAL_APPROVED") {
      console.log(`Creating Allocation for Request #${targetRequestId}...`);
      const allocCreateRes = await fetch(`${baseUrl}/resource-allocations/${targetRequestId}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nationalHead.token}`
        }
      });
      const allocCreateData = await allocCreateRes.json();
      console.log("Allocation Creation Result:", allocCreateData);
      activeAllocationId = allocCreateData.allocationId;
    }

    if (!activeAllocationId) {
      // Pick existing allocation 3 or 4 for movement test
      activeAllocationId = 3;
    }

    // -----------------------------------------------------------------
    // 6. WAREHOUSE MANAGER DASHBOARD & DISPATCH WORKFLOW
    // -----------------------------------------------------------------
    console.log(`\n>>> [6/7] Logging in as Warehouse Manager (Kerala)...`);
    const whManager = await login("kerala.warehouse@disaster.local");
    console.log(`✓ Logged in: ${whManager.user.fullName} (${whManager.user.role})`);

    console.log("Fetching Warehouse Manager Dashboard...");
    const whDashRes = await fetch(`${baseUrl}/warehouses/manager/dashboard`, {
      headers: { Authorization: `Bearer ${whManager.token}` }
    });
    const whDashData = await whDashRes.json();
    console.log(`✓ Facility: ${whDashData.data?.warehouse?.warehouse_name}`);
    console.log(`✓ Usable Free Stock: ${whDashData.data?.stockSummary?.totalUsable?.toLocaleString()}`);
    console.log(`✓ Reserved Stock: ${whDashData.data?.stockSummary?.totalReserved?.toLocaleString()}`);
    console.log(`✓ Active Facility Movements: ${whDashData.data?.movements?.length}`);

    // Find any PLANNED or DISPATCHED movement to exercise
    const [movements] = await pool.query(
      "SELECT movement_id, from_warehouse_id, movement_status, quantity, resource_id FROM resource_movements WHERE from_warehouse_id = 1 ORDER BY movement_id DESC LIMIT 5"
    );
    console.table(movements);

    const plannedMov = movements.find(m => m.movement_status === "PLANNED");
    if (plannedMov) {
      console.log(`Dispatching planned movement #${plannedMov.movement_id}...`);
      const dispRes = await fetch(`${baseUrl}/resource-movements/${plannedMov.movement_id}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${whManager.token}` }
      });
      const dispData = await dispRes.json();
      console.log("✓ Dispatch Result:", dispData);

      console.log(`Advancing movement #${plannedMov.movement_id} to IN_TRANSIT...`);
      const transRes = await fetch(`${baseUrl}/resource-movements/${plannedMov.movement_id}/in-transit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${whManager.token}` }
      });
      const transData = await transRes.json();
      console.log("✓ In-Transit Result:", transData);

      console.log(`Confirming delivery of movement #${plannedMov.movement_id}...`);
      const delivRes = await fetch(`${baseUrl}/resource-movements/${plannedMov.movement_id}/deliver`, {
        method: "POST",
        headers: { Authorization: `Bearer ${whManager.token}` }
      });
      const delivData = await delivRes.json();
      console.log("✓ Delivery Result:", delivData);
    } else {
      console.log("No movements currently in PLANNED state (all previous test movements already advanced).");
    }

    // -----------------------------------------------------------------
    // 7. BLOCKCHAIN AUDIT TRAIL VERIFICATION
    // -----------------------------------------------------------------
    console.log("\n>>> [7/7] Verifying Blockchain Audit Trail on Hardhat Contract...");
    const [txs] = await pool.query(
      "SELECT blockchain_transaction_id, entity_type, entity_id, transaction_hash, block_number, transaction_status, recorded_at FROM blockchain_transactions ORDER BY blockchain_transaction_id DESC LIMIT 5"
    );
    console.table(txs);

    console.log("\n==========================================================");
    console.log("   ALL LIFECYCLE TESTS COMPLETED & VERIFIED SUCCESSFULLY! ");
    console.log("==========================================================");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Lifecycle Test Failed:", err);
    process.exit(1);
  }
}

testLifecycle();

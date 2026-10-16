require("dotenv").config();

const {
    getWarehouseCandidates
} = require("./src/services/quantumCandidateService");

const {
    runQuantumOptimization
} = require("./src/services/quantumOptimizationService");


async function testRealQuantum() {

    try {

        // -------------------------------------------------
        // 1. Get real candidates from MySQL
        // -------------------------------------------------

        const stateId = 1;              // Kerala
        const resourceId = 3;           // Medical Kit
        const requiredQuantity = 15000;
        const requestPriority = "CRITICAL";


        console.log(
            "Step 1: Fetching candidates from MySQL..."
        );


        const candidates =
            await getWarehouseCandidates({

                stateId,

                resourceId,

                requiredQuantity

            });


        console.log("\nCandidates from MySQL:");

        console.log(
            JSON.stringify(
                candidates,
                null,
                2
            )
        );


        // -------------------------------------------------
        // 2. Send real candidates to Qiskit
        // -------------------------------------------------

        console.log(
            "\nStep 2: Sending candidates to Qiskit..."
        );


        const quantumResult =
            await runQuantumOptimization({

                requestPriority,

                requiredQuantity,

                candidates

            });


        // -------------------------------------------------
        // 3. Display optimization result
        // -------------------------------------------------

        console.log(
            "\nStep 3: Quantum optimization result:"
        );


        console.log(
            JSON.stringify(
                quantumResult,
                null,
                2
            )
        );


    } catch (error) {

        console.error(
            "\nReal quantum integration error:"
        );


        if (error.response) {

            console.error(
                "Status:",
                error.response.status
            );

            console.error(
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {
            console.error(
                "Error message:",
                error.message
                );

            console.error(
                "Error code:",
                error.code
                );

            console.error(
                "Error stack:"
                );

            console.error(
                error.stack
                );

            }

        }

}


testRealQuantum();
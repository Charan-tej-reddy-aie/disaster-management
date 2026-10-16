require("dotenv").config();

const {
    getWarehouseCandidates
} = require("./src/services/quantumCandidateService");


async function testCandidates() {

    try {

        console.log("Fetching real warehouse candidates...\n");

        const candidates =
            await getWarehouseCandidates({
                stateId: 1,          // Kerala
                resourceId: 3,       // Medical Kit
                requiredQuantity: 15000
            });


        console.log(
            JSON.stringify(
                candidates,
                null,
                2
            )
        );


    } catch (error) {

        console.error(
            "Candidate service error:"
        );

        console.error(
            error.message
        );

    }
}


testCandidates();
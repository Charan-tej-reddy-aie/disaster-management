require("dotenv").config();

const {
    runQuantumAllocationPreview
} = require("./src/services/quantumAllocationService");


async function testQuantumAllocation() {

    try {

        console.log(
            "Starting quantum allocation preview...\n"
        );


        const result =
            await runQuantumAllocationPreview(2);


        console.log(
            "Quantum allocation preview completed:\n"
        );


        console.log(
            JSON.stringify(
                result,
                null,
                2
            )
        );


    } catch (error) {

        console.error(
            "\nQuantum allocation preview failed:"
        );

        console.error(
            error.message
        );

        if (error.stack) {

            console.error(
                "\nStack:"
            );

            console.error(
                error.stack
            );
        }

    }

}


testQuantumAllocation();
require("dotenv").config();

const axios = require("axios");

const QUANTUM_SERVICE_URL =
    process.env.QUANTUM_SERVICE_URL ||
    "http://localhost:8001";


async function testQuantum() {

    const payload = {
        request_priority: "CRITICAL",

        required_quantity: 15000,

        candidates: [
            {
                warehouse_id: 1,
                warehouse_name:
                    "Kerala Central Emergency Warehouse",
                resource_id: 3,
                required_quantity: 15000,
                usable_quantity: 10000,
                distance_km: 0
            },

            {
                warehouse_id: 2,
                warehouse_name:
                    "Tamil Nadu Central Emergency Warehouse",
                resource_id: 3,
                required_quantity: 15000,
                usable_quantity: 12000,
                distance_km: 520
            }
        ]
    };


    console.log("Sending payload:");
    console.log(
        JSON.stringify(payload, null, 2)
    );


    try {

        const response = await axios.post(
            `${QUANTUM_SERVICE_URL}/optimize`,
            payload,
            {
                headers: {
                    "Content-Type": "application/json"
                },

                timeout: 120000
            }
        );


        console.log("\nQuantum service response:");

        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );


    } catch (error) {

        console.log("\nQuantum service error:");

        if (error.response) {

            console.log(
                "Status:",
                error.response.status
            );

            console.log(
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.log(error.message);

        }

    }
}


testQuantum();
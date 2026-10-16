const axios = require("axios");

const QUANTUM_SERVICE_URL =
    process.env.QUANTUM_SERVICE_URL ||
    "http://127.0.0.1:8001";


async function runQuantumOptimization({
    requestPriority,
    requiredQuantity,
    candidates
}) {

    const payload = {
        request_priority: requestPriority,
        required_quantity: Number(requiredQuantity),
        candidates: candidates.map(candidate => ({
            warehouse_id: Number(candidate.warehouse_id),
            warehouse_name: String(candidate.warehouse_name),
            resource_id: Number(candidate.resource_id),
            required_quantity: Number(candidate.required_quantity),
            usable_quantity: Number(candidate.usable_quantity),
            distance_km: Number(candidate.distance_km)
        }))
    };


    console.log(
        "\n========== QUANTUM REQUEST =========="
    );

    console.log(
        JSON.stringify(payload, null, 2)
    );

    console.log(
        "=====================================\n"
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


        return response.data;


    } catch (error) {

        console.error(
            "\n========== QUANTUM API ERROR =========="
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        console.error(
            "=======================================\n"
        );

        throw error;
    }
}


module.exports = {
    runQuantumOptimization
};
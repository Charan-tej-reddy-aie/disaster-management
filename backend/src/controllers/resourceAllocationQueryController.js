const {
    getAllAllocations,
    getAllocationById
} = require("../services/resourceAllocationQueryService");


async function getAllocations(req, res) {
    try {
        const allocations = await getAllAllocations();

        return res.json({
            success: true,
            data: allocations
        });

    } catch (error) {
        console.error("Get allocations error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load allocations",
            error: error.message
        });
    }
}


async function getAllocation(req, res) {
    try {
        const allocationId = Number(req.params.id);

        if (!Number.isInteger(allocationId) || allocationId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid allocation ID"
            });
        }

        const allocation = await getAllocationById(allocationId);

        if (!allocation || allocation.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return res.json({
            success: true,
            data: allocation
        });

    } catch (error) {
        console.error("Get allocation error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load allocation",
            error: error.message
        });
    }
}


module.exports = {
    getAllocations,
    getAllocation
};
const pool = require("../config/database");

const {
    getWarehouseCandidates
} = require("./quantumCandidateService");

const {
    runQuantumOptimization
} = require("./quantumOptimizationService");

const {
    createOptimizationRun,
    completeOptimizationRun,
    failOptimizationRun
} = require("./optimizationRunService");


/**
 * Run quantum optimization for an approved resource request.
 *
 * READ-ONLY with respect to inventory/allocation tables.
 *
 * It creates an optimization_runs record,
 * but does NOT create resource_allocations.
 */
async function runQuantumAllocationPreview(requestId) {

    let optimizationRunId = null;

    try {

        // -------------------------------------------------
        // 1. Get resource request
        // -------------------------------------------------

        const [requests] = await pool.query(
            `
            SELECT
                rr.resource_request_id,
                rr.prediction_id,
                rr.state_id,
                rr.request_status,
                rr.priority,
                rr.requested_by,

                dp.disaster_event_id,
                dp.severity,
                dp.probability,
                dp.affected_population,
                dp.affected_area_km2,

                de.disaster_type_id,
                dt.disaster_name

            FROM resource_requests rr

            JOIN disaster_predictions dp
                ON dp.prediction_id = rr.prediction_id

            JOIN disaster_events de
                ON de.disaster_event_id = dp.disaster_event_id

            JOIN disaster_types dt
                ON dt.disaster_type_id = de.disaster_type_id

            WHERE rr.resource_request_id = ?

            LIMIT 1
            `,
            [requestId]
        );


        if (requests.length === 0) {

            throw new Error(
                `Resource request ${requestId} not found`
            );
        }


        const request = requests[0];


        // -------------------------------------------------
        // 2. Validate request status
        // -------------------------------------------------

        if (
            request.request_status !==
            "NATIONAL_APPROVED"
        ) {

            throw new Error(
                `Request ${requestId} must be NATIONAL_APPROVED before quantum optimization`
            );
        }


        // -------------------------------------------------
        // 3. Get requested resources
        // -------------------------------------------------

        const [items] = await pool.query(
            `
            SELECT
                rri.request_item_id,
                rri.resource_id,
                r.resource_name,
                r.unit,
                rri.quantity_requested,
                rri.quantity_approved

            FROM resource_request_items rri

            JOIN resources r
                ON r.resource_id = rri.resource_id

            WHERE rri.resource_request_id = ?

            ORDER BY rri.request_item_id
            `,
            [requestId]
        );


        if (items.length === 0) {

            throw new Error(
                `No resource items found for request ${requestId}`
            );
        }


        // -------------------------------------------------
        // 4. Create optimization run
        // -------------------------------------------------

        const inputData = {

            request_id:
                request.resource_request_id,

            prediction_id:
                request.prediction_id,

            state_id:
                request.state_id,

            disaster_name:
                request.disaster_name,

            severity:
                request.severity,

            priority:
                request.priority,

            items

        };


        optimizationRunId =
            await createOptimizationRun({

                requestId,

                algorithmName:
                    "QAOA_STYLE_MULTI_WAREHOUSE",

                algorithmVersion:
                    "2.0",

                inputData

            });


        // -------------------------------------------------
        // 5. Optimize every resource
        // -------------------------------------------------

        const optimizedResources = [];


        for (const item of items) {

            const approvedQuantity =
                Number(item.quantity_approved);

            const requestedQuantity =
                Number(item.quantity_requested);

            const requiredQuantity =
                approvedQuantity > 0
                    ? approvedQuantity
                    : requestedQuantity;


            if (requiredQuantity <= 0) {

                optimizedResources.push({

                    resource_id:
                        item.resource_id,

                    resource_name:
                        item.resource_name,

                    required_quantity:
                        requiredQuantity,

                    allocations: [],

                    total_allocated: 0,

                    shortage: 0

                });

                continue;
            }


            // ---------------------------------------------
            // Get real warehouse candidates
            // ---------------------------------------------

            const candidates =
                await getWarehouseCandidates({

                    stateId:
                        request.state_id,

                    resourceId:
                        item.resource_id,

                    requiredQuantity

                });


            if (candidates.length === 0) {

                optimizedResources.push({

                    resource_id:
                        item.resource_id,

                    resource_name:
                        item.resource_name,

                    required_quantity:
                        requiredQuantity,

                    candidates: [],

                    allocations: [],

                    total_allocated: 0,

                    shortage: requiredQuantity

                });

                continue;
            }


            // ---------------------------------------------
            // Prepare candidates for Qiskit
            // ---------------------------------------------

            const quantumCandidates =
                candidates.map(candidate => ({

                    warehouse_id:
                        candidate.warehouse_id,

                    warehouse_name:
                        candidate.warehouse_name,

                    resource_id:
                        candidate.resource_id,

                    required_quantity:
                        requiredQuantity,

                    usable_quantity:
                        candidate.usable_quantity,

                    distance_km:
                        candidate.distance_km

                }));


            // ---------------------------------------------
            // Call Qiskit
            // ---------------------------------------------

            const quantumResult =
                await runQuantumOptimization({

                    requestPriority:
                        request.priority,

                    requiredQuantity,

                    candidates:
                        quantumCandidates

                });


            // ---------------------------------------------
            // Store result
            // ---------------------------------------------

            const result =
                quantumResult.result;


            optimizedResources.push({

                resource_id:
                    item.resource_id,

                resource_name:
                    item.resource_name,

                unit:
                    item.unit,

                required_quantity:
                    requiredQuantity,

                candidates:
                    quantumCandidates,

                quantum_selected_indices:
                    result.quantum_selected_indices,

                allocations:
                    result.allocations,

                total_allocated:
                    result.total_allocated,

                shortage:
                    result.shortage,

                costs:
                    result.costs

            });
        }


        // -------------------------------------------------
        // 6. Calculate objective value
        // -------------------------------------------------

        const totalRequired =
            optimizedResources.reduce(
                (sum, resource) =>
                    sum +
                    Number(
                        resource.required_quantity
                    ),
                0
            );


        const totalAllocated =
            optimizedResources.reduce(
                (sum, resource) =>
                    sum +
                    Number(
                        resource.total_allocated
                    ),
                0
            );


        const totalShortage =
            optimizedResources.reduce(
                (sum, resource) =>
                    sum +
                    Number(
                        resource.shortage
                    ),
                0
            );


        const objectiveValue =
            totalRequired > 0
                ? totalShortage / totalRequired
                : 0;


        // -------------------------------------------------
        // 7. Save optimization result
        // -------------------------------------------------

        const outputData = {

            request_id:
                requestId,

            optimization_run_id:
                optimizationRunId,

            disaster: {

                name:
                    request.disaster_name,

                severity:
                    request.severity,

                probability:
                    request.probability,

                affected_population:
                    request.affected_population,

                affected_area_km2:
                    request.affected_area_km2

            },

            total_required:
                totalRequired,

            total_allocated:
                totalAllocated,

            total_shortage:
                totalShortage,

            resources:
                optimizedResources

        };


        await completeOptimizationRun({

            optimizationRunId,

            objectiveValue,

            outputData

        });


        // -------------------------------------------------
        // 8. Return result
        // -------------------------------------------------

        return {

            success: true,

            optimizationRunId,

            requestId,

            algorithm:
                "QAOA_STYLE_MULTI_WAREHOUSE",

            totalRequired,

            totalAllocated,

            totalShortage,

            resources:
                optimizedResources

        };


    } catch (error) {

        // ---------------------------------------------
        // Mark optimization run as failed
        // ---------------------------------------------

        if (optimizationRunId) {

            await failOptimizationRun({

                optimizationRunId,

                errorMessage:
                    error.message

            });
        }


        throw error;
    }
}


module.exports = {
    runQuantumAllocationPreview
};
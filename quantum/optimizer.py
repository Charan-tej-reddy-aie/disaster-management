import math
import numpy as np

from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorSampler


# ---------------------------------------------------------
# Utility
# ---------------------------------------------------------

def normalize(value, minimum, maximum):
    if maximum == minimum:
        return 0.0

    return (value - minimum) / (maximum - minimum)


# ---------------------------------------------------------
# Calculate cost of each warehouse
# ---------------------------------------------------------

def calculate_warehouse_costs(candidates, request_priority):
    """
    Calculate a cost score for every warehouse.

    Lower cost = better warehouse.

    Factors:
        1. Distance
        2. Quantity availability
        3. Shortage penalty
        4. Disaster priority
    """

    if not candidates:
        return []

    distances = [
        float(candidate.get("distance_km", 0))
        for candidate in candidates
    ]

    max_distance = max(distances) if distances else 1.0

    priority_weight = {
        "LOW": 1.0,
        "MEDIUM": 1.5,
        "HIGH": 2.0,
        "CRITICAL": 3.0
    }.get(request_priority.upper(), 1.0)

    costs = []

    for candidate in candidates:

        distance = float(
            candidate.get("distance_km", 0)
        )

        usable_quantity = float(
            candidate.get("usable_quantity", 0)
        )

        required_quantity = float(
            candidate.get("required_quantity", 0)
        )

        # ---------------------------------------------
        # Distance component
        # ---------------------------------------------

        distance_cost = normalize(
            distance,
            0,
            max_distance
        )

        # ---------------------------------------------
        # Fulfillment component
        # ---------------------------------------------

        if required_quantity <= 0:
            fulfillment = 1.0
        else:
            fulfillment = min(
                usable_quantity / required_quantity,
                1.0
            )

        shortage_penalty = 1.0 - fulfillment

        # ---------------------------------------------
        # Final cost
        # ---------------------------------------------

        cost = (
            0.40 * distance_cost
            +
            0.50 * shortage_penalty * priority_weight
            +
            0.10 * (1.0 - fulfillment)
        )

        costs.append(cost)

    return costs


# ---------------------------------------------------------
# Quantum circuit
# ---------------------------------------------------------

def create_qaoa_style_circuit(costs):
    """
    Creates a simplified QAOA-style quantum circuit.

    This prototype uses one qubit per warehouse candidate.
    """

    number_of_qubits = len(costs)

    if number_of_qubits == 0:
        return None

    circuit = QuantumCircuit(number_of_qubits)

    # ---------------------------------------------
    # Initial superposition
    # ---------------------------------------------

    for qubit in range(number_of_qubits):
        circuit.h(qubit)

    # ---------------------------------------------
    # Cost encoding
    # ---------------------------------------------

    gamma = math.pi / 4

    for qubit, cost in enumerate(costs):

        circuit.rz(
            2 * gamma * float(cost),
            qubit
        )

    # ---------------------------------------------
    # Mixer
    # ---------------------------------------------

    beta = math.pi / 4

    for qubit in range(number_of_qubits):

        circuit.rx(
            2 * beta,
            qubit
        )

    circuit.measure_all()

    return circuit


# ---------------------------------------------------------
# Quantum warehouse selection
# ---------------------------------------------------------

def quantum_select_warehouses(
    candidates,
    request_priority="MEDIUM",
    shots=1024
):
    """
    Use the quantum circuit to identify promising warehouses.

    IMPORTANT:
    This is a prototype QAOA-style simulation.
    The final quantity distribution is calculated
    after the quantum candidate selection.
    """

    if not candidates:
        raise ValueError(
            "No warehouse candidates supplied"
        )

    costs = calculate_warehouse_costs(
        candidates,
        request_priority
    )

    circuit = create_qaoa_style_circuit(costs)

    sampler = StatevectorSampler(
        seed=42
    )

    result = sampler.run(
        [circuit],
        shots=shots
    ).result()

    counts = result[0].data.meas.get_counts()

    ranked_states = sorted(
        counts.items(),
        key=lambda item: item[1],
        reverse=True
    )

    selected_indices = []

    # ---------------------------------------------
    # Examine quantum states
    # ---------------------------------------------

    for bitstring, count in ranked_states:

        bits = bitstring[::-1]

        active_indices = [
            index
            for index, bit in enumerate(bits)
            if bit == "1"
        ]

        for index in active_indices:

            if index not in selected_indices:
                selected_indices.append(index)

    # ---------------------------------------------
    # Safety fallback
    # ---------------------------------------------

    if not selected_indices:

        selected_indices = list(
            np.argsort(costs)
        )

    return {
        "selected_indices": selected_indices,
        "costs": costs,
        "quantum_states": ranked_states
    }


# ---------------------------------------------------------
# Allocate quantity across warehouses
# ---------------------------------------------------------

def distribute_quantity(
    candidates,
    selected_indices,
    required_quantity
):
    """
    Distribute the required quantity across the
    quantum-selected warehouses.

    Warehouses with lower cost are preferred.
    """

    required_quantity = float(
        required_quantity
    )

    # ---------------------------------------------
    # Sort selected warehouses by cost
    # ---------------------------------------------

    costs = calculate_warehouse_costs(
        candidates,
        "MEDIUM"
    )

    selected_indices = sorted(
        selected_indices,
        key=lambda index: costs[index]
    )

    remaining_quantity = required_quantity

    allocations = []

    # ---------------------------------------------
    # Allocate available stock
    # ---------------------------------------------

    for index in selected_indices:

        if remaining_quantity <= 0:
            break

        candidate = candidates[index]

        usable_quantity = float(
            candidate.get("usable_quantity", 0)
        )

        allocated_quantity = min(
            usable_quantity,
            remaining_quantity
        )

        if allocated_quantity <= 0:
            continue

        allocations.append({
            "warehouse_id":
                candidate["warehouse_id"],

            "warehouse_name":
                candidate["warehouse_name"],

            "resource_id":
                candidate["resource_id"],

            "quantity_allocated":
                allocated_quantity,

            "distance_km":
                candidate["distance_km"],

            "cost":
                costs[index]
        })

        remaining_quantity -= allocated_quantity

    # ---------------------------------------------
    # Shortage
    # ---------------------------------------------

    shortage = max(
        required_quantity - sum(
            allocation["quantity_allocated"]
            for allocation in allocations
        ),
        0
    )

    return {
        "required_quantity": required_quantity,
        "allocations": allocations,
        "total_allocated":
            required_quantity - shortage,
        "shortage": shortage
    }


# ---------------------------------------------------------
# Main optimization function
# ---------------------------------------------------------

def optimize_resource(
    candidates,
    required_quantity,
    request_priority="MEDIUM",
    shots=1024
):
    """
    Complete quantum-assisted resource optimization.
    """

    if not candidates:
        raise ValueError(
            "No warehouse candidates supplied"
        )

    required_quantity = float(
        required_quantity
    )

    # ---------------------------------------------
    # Quantum selection
    # ---------------------------------------------

    quantum_result = quantum_select_warehouses(
        candidates=candidates,
        request_priority=request_priority,
        shots=shots
    )

    selected_indices = quantum_result[
        "selected_indices"
    ]

    # ---------------------------------------------
    # Quantity distribution
    # ---------------------------------------------

    allocation_result = distribute_quantity(
        candidates=candidates,
        selected_indices=selected_indices,
        required_quantity=required_quantity
    )

    # ---------------------------------------------
    # Final result
    # ---------------------------------------------

    return {
        "algorithm":
            "QAOA_STYLE_MULTI_WAREHOUSE",

        "request_priority":
            request_priority,

        "required_quantity":
            required_quantity,

        "quantum_selected_indices":
            selected_indices,

        "allocations":
            allocation_result["allocations"],

        "total_allocated":
            allocation_result["total_allocated"],

        "shortage":
            allocation_result["shortage"],

        "costs":
            quantum_result["costs"],

        "quantum_states":
            quantum_result["quantum_states"]
    }
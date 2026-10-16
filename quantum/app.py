from fastapi import FastAPI
from pydantic import BaseModel

from optimizer import optimize_resource


app = FastAPI(
    title="Disaster Resource Quantum Optimizer",
    version="2.0"
)


# ---------------------------------------------------------
# Warehouse Candidate
# ---------------------------------------------------------

class WarehouseCandidate(BaseModel):

    warehouse_id: int
    warehouse_name: str
    resource_id: int

    required_quantity: float
    usable_quantity: float

    distance_km: float


# ---------------------------------------------------------
# Optimization Request
# ---------------------------------------------------------

class OptimizationRequest(BaseModel):

    request_priority: str

    required_quantity: float

    candidates: list[WarehouseCandidate]


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "success": True,
        "message": "Quantum optimization service is running",
        "version": "2.0"
    }


# ---------------------------------------------------------
# Optimization API
# ---------------------------------------------------------

@app.post("/optimize")
def optimize(request: OptimizationRequest):

    candidates = [
        candidate.model_dump()
        for candidate in request.candidates
    ]

    result = optimize_resource(
        candidates=candidates,
        required_quantity=request.required_quantity,
        request_priority=request.request_priority
    )

    return {
        "success": True,
        "algorithm": result["algorithm"],
        "result": result
    }
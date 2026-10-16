from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_FILE = (
    BASE_DIR
    / "models"
    / "disaster_random_forest.joblib"
)


# ============================================================
# LOAD MODEL
# ============================================================

if not MODEL_FILE.exists():
    raise FileNotFoundError(
        f"Model not found: {MODEL_FILE}"
    )

artifact = joblib.load(MODEL_FILE)

model = artifact["model"]
FEATURES = artifact["features"]
MEDIANS = artifact["medians"]
CLASSES = artifact["classes"]


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Disaster Prediction ML Service",
    version="1.0.0",
    description="Weather-based disaster prediction service"
)


# ============================================================
# REQUEST MODEL
# ============================================================

class WeatherInput(BaseModel):

    temperature_2m_mean: float
    temperature_2m_max: float
    temperature_2m_min: float
    temperature_range: float

    precipitation_sum: float

    rainfall_1d: float
    rainfall_3d: float
    rainfall_7d: float
    rainfall_14d: float

    rainfall_3d_mean: float
    rainfall_7d_mean: float

    relative_humidity_2m_mean: float
    humidity_3d_mean: float
    humidity_7d_mean: float

    surface_pressure_mean: float
    pressure_change_1d: float
    pressure_change_3d: float

    wind_speed_10m_mean: float
    wind_speed_10m_max: float
    wind_3d_mean: float
    wind_7d_mean: float
    wind_max_7d: float

    wind_direction_10m_dominant: float


# ============================================================
# HEALTH
# ============================================================

@app.get("/")
def root():

    return {
        "service": "Disaster Prediction ML Service",
        "status": "running",
        "model": "Random Forest baseline",
        "classes": CLASSES
    }


@app.get("/health")
def health():

    return {
        "status": "OK",
        "model_loaded": True,
        "model_file": str(MODEL_FILE),
        "classes": CLASSES
    }


# ============================================================
# SEVERITY
# ============================================================

def calculate_severity(probability: float):

    if probability >= 0.80:
        return "CRITICAL"

    if probability >= 0.60:
        return "HIGH"

    if probability >= 0.40:
        return "MEDIUM"

    return "LOW"


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict(data: WeatherInput):

    try:

        values = data.model_dump()

        # Keep exact feature order used during training
        row = {}

        for feature in FEATURES:

            value = values.get(feature)

            if value is None:
                value = MEDIANS.get(feature, 0)

            row[feature] = value

        X = pd.DataFrame(
            [row],
            columns=FEATURES
        )

        # ----------------------------------------------------
        # Prediction
        # ----------------------------------------------------

        probabilities = model.predict_proba(X)[0]

        predicted_index = probabilities.argmax()

        predicted_disaster = model.classes_[
            predicted_index
        ]

        probability = float(
            probabilities[predicted_index]
        )

        severity = calculate_severity(
            probability
        )

        # ----------------------------------------------------
        # Class probabilities
        # ----------------------------------------------------

        class_probabilities = {
            str(cls): round(
                float(prob),
                6
            )
            for cls, prob in zip(
                model.classes_,
                probabilities
            )
        }

        return {
            "success": True,
            "predicted_disaster": str(
                predicted_disaster
            ),
            "probability": round(
                probability,
                6
            ),
            "severity": severity,
            "class_probabilities":
                class_probabilities
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# 1. LOAD DATASET
# ============================================================

DATASET_PATH = "data/flood_risk_dataset_india.csv"

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully.")
print("Shape:", df.shape)


# ============================================================
# 2. DEFINE FEATURES AND TARGET
# ============================================================

features = [
    "Latitude",
    "Longitude",
    "Rainfall (mm)",
    "Temperature (°C)",
    "Humidity (%)",
    "River Discharge (m³/s)",
    "Water Level (m)",
    "Elevation (m)",
    "Land Cover",
    "Soil Type",
    "Population Density",
    "Infrastructure",
    "Historical Floods"
]

target = "Flood Occurred"


X = df[features]
y = df[target]


# ============================================================
# 3. DEFINE COLUMN TYPES
# ============================================================

categorical_features = [
    "Land Cover",
    "Soil Type"
]

numeric_features = [
    "Latitude",
    "Longitude",
    "Rainfall (mm)",
    "Temperature (°C)",
    "Humidity (%)",
    "River Discharge (m³/s)",
    "Water Level (m)",
    "Elevation (m)",
    "Population Density",
    "Infrastructure",
    "Historical Floods"
]


# ============================================================
# 4. PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),

        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# ============================================================
# 5. RANDOM FOREST MODEL
# ============================================================

model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    n_jobs=-1
)


# ============================================================
# 6. CREATE PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# ============================================================
# 7. TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# ============================================================
# 8. TRAIN MODEL
# ============================================================

print("\nTraining Random Forest model...")

pipeline.fit(
    X_train,
    y_train
)

print("Training completed.")


# ============================================================
# 9. PREDICTION
# ============================================================

y_pred = pipeline.predict(X_test)


# ============================================================
# 10. EVALUATION
# ============================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred
)

recall = recall_score(
    y_test,
    y_pred
)

f1 = f1_score(
    y_test,
    y_pred
)


print("\n================================")
print("MODEL PERFORMANCE")
print("================================")

print(
    f"Accuracy  : {accuracy:.4f}"
)

print(
    f"Precision : {precision:.4f}"
)

print(
    f"Recall    : {recall:.4f}"
)

print(
    f"F1 Score  : {f1:.4f}"
)


print("\n================================")
print("CLASSIFICATION REPORT")
print("================================")

print(
    classification_report(
        y_test,
        y_pred
    )
)


print("\n================================")
print("CONFUSION MATRIX")
print("================================")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# ============================================================
# 11. SAVE MODEL
# ============================================================

MODEL_PATH = "models/flood_prediction_model.pkl"

joblib.dump(
    pipeline,
    MODEL_PATH
)

print("\nModel saved successfully:")
print(MODEL_PATH)
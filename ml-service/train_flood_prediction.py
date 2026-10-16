import pandas as pd
import numpy as np
import joblib
import os

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score
)


# ============================================
# CONFIGURATION
# ============================================

DATA_FILE = "data/kerala_daily_flood_dataset.csv"
MODEL_DIR = "models"
MODEL_FILE = os.path.join(
    MODEL_DIR,
    "kerala_flood_prediction_model.pkl"
)

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================
# LOAD DATA
# ============================================

print("========================================")
print("Loading dataset")
print("========================================")

df = pd.read_csv(DATA_FILE)

df["Date"] = pd.to_datetime(df["Date"])

print(f"Total rows: {len(df)}")


# ============================================
# REMOVE ROWS WITH UNKNOWN FUTURE TARGET
# ============================================

df = df.dropna(
    subset=["Flood_Next_3_Days"]
)


# ============================================
# TIME-BASED SPLIT
# ============================================

print("\n========================================")
print("Time-based split")
print("========================================")

train_df = df[
    df["Date"] < "2019-01-01"
].copy()

validation_df = df[
    (df["Date"] >= "2019-01-01") &
    (df["Date"] < "2021-01-01")
].copy()

test_df = df[
    df["Date"] >= "2021-01-01"
].copy()

print(
    f"Training:   {len(train_df)} rows "
    f"({train_df['Date'].min().date()} → "
    f"{train_df['Date'].max().date()})"
)

print(
    f"Validation: {len(validation_df)} rows "
    f"({validation_df['Date'].min().date()} → "
    f"{validation_df['Date'].max().date()})"
)

print(
    f"Test:       {len(test_df)} rows "
    f"({test_df['Date'].min().date()} → "
    f"{test_df['Date'].max().date()})"
)


# ============================================
# TARGET
# ============================================

TARGET = "Flood_Next_3_Days"


# ============================================
# FEATURES
# ============================================

FEATURES = [
    "District",

    "Latitude",
    "Longitude",

    "temperature_2m_mean",
    "temperature_2m_max",
    "temperature_2m_min",

    "relative_humidity_2m_mean",

    "precipitation_sum",

    "pressure_msl_mean",

    "wind_speed_10m_mean",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",

    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",

    "rainfall_max_3d",
    "rainfall_max_7d",

    "humidity_3d_mean",
    "humidity_7d_mean",

    "pressure_change_1d",
    "pressure_change_3d"
]


X_train = train_df[FEATURES]
y_train = train_df[TARGET]

X_validation = validation_df[FEATURES]
y_validation = validation_df[TARGET]

X_test = test_df[FEATURES]
y_test = test_df[TARGET]


# ============================================
# PREPROCESSING
# ============================================

categorical_features = [
    "District"
]

numeric_features = [
    feature
    for feature in FEATURES
    if feature not in categorical_features
]


preprocessor = ColumnTransformer(
    transformers=[
        (
            "district",
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


# ============================================
# MODEL
# ============================================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=18,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "classifier",
            model
        )
    ]
)


# ============================================
# TRAIN
# ============================================

print("\n========================================")
print("Training Random Forest")
print("========================================")

pipeline.fit(
    X_train,
    y_train
)

print("✅ Training completed")


# ============================================
# VALIDATION
# ============================================

print("\n========================================")
print("Validation Results")
print("========================================")

validation_probability = pipeline.predict_proba(
    X_validation
)[:, 1]

validation_prediction = (
    validation_probability >= 0.5
).astype(int)

print(
    classification_report(
        y_validation,
        validation_prediction,
        digits=4,
        zero_division=0
    )
)

print("Confusion Matrix:")

print(
    confusion_matrix(
        y_validation,
        validation_prediction
    )
)

print(
    "ROC-AUC:",
    round(
        roc_auc_score(
            y_validation,
            validation_probability
        ),
        4
    )
)

print(
    "PR-AUC:",
    round(
        average_precision_score(
            y_validation,
            validation_probability
        ),
        4
    )
)


# ============================================
# FINAL TEST
# ============================================

print("\n========================================")
print("Final Test Results")
print("========================================")

test_probability = pipeline.predict_proba(
    X_test
)[:, 1]

test_prediction = (
    test_probability >= 0.5
).astype(int)

print(
    classification_report(
        y_test,
        test_prediction,
        digits=4,
        zero_division=0
    )
)

print("Confusion Matrix:")

print(
    confusion_matrix(
        y_test,
        test_prediction
    )
)

roc_auc = roc_auc_score(
    y_test,
    test_probability
)

pr_auc = average_precision_score(
    y_test,
    test_probability
)

print(
    "ROC-AUC:",
    round(roc_auc, 4)
)

print(
    "PR-AUC:",
    round(pr_auc, 4)
)


# ============================================
# SAVE MODEL
# ============================================

joblib.dump(
    pipeline,
    MODEL_FILE
)

print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(
    f"Model: {MODEL_FILE}"
)
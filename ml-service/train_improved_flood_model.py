import pandas as pd
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

DATA_FILE = "data/kerala_flood_ml_features.csv"
MODEL_FILE = "models/kerala_flood_prediction_improved.pkl"

os.makedirs("models", exist_ok=True)

print("========================================")
print("Loading engineered dataset")
print("========================================")

df = pd.read_csv(DATA_FILE)

df["Date"] = pd.to_datetime(df["Date"])

print(f"Total rows: {len(df)}")


# ============================================
# TIME-BASED SPLIT
# ============================================

train_df = df[df["Date"] < "2019-01-01"].copy()

validation_df = df[
    (df["Date"] >= "2019-01-01") &
    (df["Date"] < "2021-01-01")
].copy()

test_df = df[
    df["Date"] >= "2021-01-01"
].copy()

print("\n========================================")
print("Time-based split")
print("========================================")

print(f"Training:   {len(train_df)}")
print(f"Validation: {len(validation_df)}")
print(f"Test:       {len(test_df)}")


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
    "pressure_change_3d",

    # New engineered features

    "month",
    "month_sin",
    "month_cos",

    "day_of_year_sin",
    "day_of_year_cos",

    "southwest_monsoon",
    "northeast_monsoon",

    "rainfall_ratio_3d_7d",
    "rainfall_ratio_7d_14d",

    "rainfall_acceleration",

    "temperature_range",

    "pressure_drop_3d",
    "pressure_drop_1d",

    "heavy_rain_day",
    "very_heavy_rain_day",

    "extreme_3d_rain",
    "extreme_7d_rain"
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
# RANDOM FOREST
# ============================================

model = RandomForestClassifier(
    n_estimators=400,
    max_depth=20,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("classifier", model)
    ]
)


# ============================================
# TRAIN
# ============================================

print("\n========================================")
print("Training improved Random Forest")
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
print("VALIDATION RESULTS")
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

validation_roc = roc_auc_score(
    y_validation,
    validation_probability
)

validation_pr = average_precision_score(
    y_validation,
    validation_probability
)

print(
    "ROC-AUC:",
    round(validation_roc, 4)
)

print(
    "PR-AUC:",
    round(validation_pr, 4)
)


# ============================================
# TEST
# ============================================

print("\n========================================")
print("FINAL TEST RESULTS")
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

test_roc = roc_auc_score(
    y_test,
    test_probability
)

test_pr = average_precision_score(
    y_test,
    test_probability
)

print(
    "ROC-AUC:",
    round(test_roc, 4)
)

print(
    "PR-AUC:",
    round(test_pr, 4)
)


# ============================================
# SAVE
# ============================================

joblib.dump(
    pipeline,
    MODEL_FILE
)

print("\n========================================")
print("MODEL SAVED")
print("========================================")

print(f"Model: {MODEL_FILE}")
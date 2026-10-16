import pandas as pd
import joblib
import numpy as np

from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score
)


# ============================================
# FILES
# ============================================

DATA_FILE = "data/kerala_daily_flood_dataset.csv"

MODEL_FILE = "models/kerala_flood_prediction_model.pkl"


# ============================================
# LOAD DATA
# ============================================

df = pd.read_csv(DATA_FILE)

df["Date"] = pd.to_datetime(df["Date"])


# ============================================
# SAME TEST SPLIT AS TRAINING
# ============================================

test_df = df[
    df["Date"] >= "2021-01-01"
].copy()


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

TARGET = "Flood_Next_3_Days"


X_test = test_df[FEATURES]

y_test = test_df[TARGET]


# ============================================
# LOAD MODEL
# ============================================

model = joblib.load(MODEL_FILE)


# ============================================
# PREDICT PROBABILITIES
# ============================================

probabilities = model.predict_proba(
    X_test
)[:, 1]


print("========================================")
print("Flood Threshold Evaluation")
print("========================================")

print(f"Test rows: {len(test_df)}")
print(f"Actual floods: {y_test.sum()}")
print()


# ============================================
# EVALUATE THRESHOLDS
# ============================================

thresholds = np.arange(
    0.05,
    0.96,
    0.05
)

results = []

for threshold in thresholds:

    predictions = (
        probabilities >= threshold
    ).astype(int)

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    false_alarms = (
        (predictions == 1) &
        (y_test == 0)
    ).sum()

    missed_floods = (
        (predictions == 0) &
        (y_test == 1)
    ).sum()

    results.append({
        "Threshold": round(threshold, 2),
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "False_Alarms": false_alarms,
        "Missed_Floods": missed_floods
    })


results_df = pd.DataFrame(results)


# ============================================
# DISPLAY
# ============================================

print(
    results_df.to_string(
        index=False,
        formatters={
            "Precision": "{:.4f}".format,
            "Recall": "{:.4f}".format,
            "F1": "{:.4f}".format
        }
    )
)


# ============================================
# BEST F1
# ============================================

best_f1 = results_df.loc[
    results_df["F1"].idxmax()
]

print("\n========================================")
print("BEST F1 THRESHOLD")
print("========================================")

print(
    best_f1.to_string()
)


# ============================================
# HIGH-RECALL OPTION
# ============================================

high_recall = results_df[
    results_df["Recall"] >= 0.50
]

if not high_recall.empty:

    best_high_recall = high_recall.loc[
        high_recall["Precision"].idxmax()
    ]

    print("\n========================================")
    print("BEST PRECISION WITH RECALL >= 50%")
    print("========================================")

    print(
        best_high_recall.to_string()
    )
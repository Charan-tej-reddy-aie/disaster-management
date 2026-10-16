from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)
from sklearn.preprocessing import label_binarize
from sklearn.utils.class_weight import compute_class_weight

import matplotlib.pyplot as plt


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_FILE = (
    BASE_DIR
    / "data"
    / "final"
    / "disaster_ml_dataset.csv"
)

MODEL_DIR = BASE_DIR / "models"

MODEL_FILE = MODEL_DIR / "disaster_random_forest.joblib"

CM_FILE = MODEL_DIR / "confusion_matrix.png"

ROC_FILE = MODEL_DIR / "roc_curve.png"


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
    "temperature_2m_mean",
    "temperature_2m_max",
    "temperature_2m_min",
    "temperature_range",

    "precipitation_sum",

    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_14d",

    "rainfall_3d_mean",
    "rainfall_7d_mean",

    "relative_humidity_2m_mean",
    "humidity_3d_mean",
    "humidity_7d_mean",

    "surface_pressure_mean",
    "pressure_change_1d",
    "pressure_change_3d",

    "wind_speed_10m_mean",
    "wind_speed_10m_max",
    "wind_3d_mean",
    "wind_7d_mean",
    "wind_max_7d",

    "wind_direction_10m_dominant"
]


TARGET = "disaster_label"


# ============================================================
# SETTINGS
# ============================================================

RANDOM_STATE = 42

# We don't want 5.6M rows to make the first RF training
# unnecessarily expensive.
MAX_NORMAL = 100_000

# Keep as many real disaster samples as available.
MAX_PER_DISASTER = 100_000


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 70)
print("DISASTER PREDICTION — RANDOM FOREST BASELINE")
print("=" * 70)

print("\nLoading dataset...")

df = pd.read_csv(
    DATA_FILE,
    low_memory=False
)

print(
    f"Original rows: {len(df):,}"
)


# ============================================================
# REMOVE INVALID ROWS
# ============================================================

df = df.dropna(
    subset=[TARGET]
).copy()


# ============================================================
# CLASS SAMPLING
# ============================================================

print("\nOriginal class distribution:")

print(
    df[TARGET]
    .value_counts()
    .to_string()
)


balanced_parts = []

for label, group in df.groupby(TARGET):

    if label == "NORMAL":

        n = min(
            len(group),
            MAX_NORMAL
        )

    else:

        n = min(
            len(group),
            MAX_PER_DISASTER
        )

    sampled = group.sample(
        n=n,
        random_state=RANDOM_STATE
    )

    balanced_parts.append(sampled)


df = pd.concat(
    balanced_parts,
    ignore_index=True
)

# Shuffle
df = df.sample(
    frac=1,
    random_state=RANDOM_STATE
).reset_index(drop=True)


print("\nTraining dataset distribution:")

print(
    df[TARGET]
    .value_counts()
    .to_string()
)

print(
    f"\nTraining rows: {len(df):,}"
)


# ============================================================
# TIME-BASED SPLIT
# ============================================================

print("\nPreparing time-based split...")

df["date"] = pd.to_datetime(
    df["date"],
    errors="coerce"
)

df = df.sort_values(
    "date"
).reset_index(drop=True)


# 70% train
# 15% validation
# 15% test

n = len(df)

train_end = int(n * 0.70)
val_end = int(n * 0.85)

train_df = df.iloc[:train_end]
val_df = df.iloc[train_end:val_end]
test_df = df.iloc[val_end:]


print(
    f"Train      : {len(train_df):,}"
)

print(
    f"Validation : {len(val_df):,}"
)

print(
    f"Test       : {len(test_df):,}"
)


# ============================================================
# X / Y
# ============================================================

X_train = train_df[FEATURES].copy()
y_train = train_df[TARGET].copy()

X_val = val_df[FEATURES].copy()
y_val = val_df[TARGET].copy()

X_test = test_df[FEATURES].copy()
y_test = test_df[TARGET].copy()


# ============================================================
# HANDLE MISSING FEATURES
# ============================================================

X_train = X_train.replace(
    [np.inf, -np.inf],
    np.nan
)

X_val = X_val.replace(
    [np.inf, -np.inf],
    np.nan
)

X_test = X_test.replace(
    [np.inf, -np.inf],
    np.nan
)

# Median imputation using training data only
medians = X_train.median()

X_train = X_train.fillna(medians)
X_val = X_val.fillna(medians)
X_test = X_test.fillna(medians)


# ============================================================
# CLASS WEIGHTS
# ============================================================

classes = np.unique(y_train)

weights = compute_class_weight(
    class_weight="balanced",
    classes=classes,
    y=y_train
)

class_weights = dict(
    zip(classes, weights)
)

print("\nClass weights:")

for cls, weight in class_weights.items():
    print(
        f"{cls:12s}: {weight:.4f}"
    )


# ============================================================
# MODEL
# ============================================================

print("\nTraining Random Forest...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=18,
    min_samples_leaf=3,
    class_weight=class_weights,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

model.fit(
    X_train,
    y_train
)


# ============================================================
# VALIDATION
# ============================================================

print("\n" + "=" * 70)
print("VALIDATION")
print("=" * 70)

val_predictions = model.predict(X_val)

val_accuracy = accuracy_score(
    y_val,
    val_predictions
)

print(
    f"\nValidation Accuracy: "
    f"{val_accuracy:.4f}"
)

print(
    "\nClassification Report:"
)

print(
    classification_report(
        y_val,
        val_predictions,
        zero_division=0
    )
)


# ============================================================
# TEST
# ============================================================

print("\n" + "=" * 70)
print("TEST")
print("=" * 70)

test_predictions = model.predict(X_test)

test_probabilities = model.predict_proba(
    X_test
)

test_accuracy = accuracy_score(
    y_test,
    test_predictions
)

print(
    f"\nTest Accuracy: "
    f"{test_accuracy:.4f}"
)

print(
    "\nClassification Report:"
)

print(
    classification_report(
        y_test,
        test_predictions,
        zero_division=0
    )
)


# ============================================================
# ROC-AUC
# ============================================================

try:

    test_classes = model.classes_

    y_test_binary = label_binarize(
        y_test,
        classes=test_classes
    )

    auc = roc_auc_score(
        y_test_binary,
        test_probabilities,
        multi_class="ovr",
        average="weighted"
    )

    print(
        f"\nWeighted ROC-AUC: "
        f"{auc:.4f}"
    )

except Exception as e:

    print(
        f"\nROC-AUC could not be calculated: {e}"
    )

    auc = None


# ============================================================
# CONFUSION MATRIX
# ============================================================

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

cm = confusion_matrix(
    y_test,
    test_predictions,
    labels=model.classes_
)

plt.figure(
    figsize=(10, 8)
)

plt.imshow(cm)

plt.title(
    "Disaster Prediction Confusion Matrix"
)

plt.xlabel(
    "Predicted"
)

plt.ylabel(
    "Actual"
)

plt.xticks(
    range(len(model.classes_)),
    model.classes_,
    rotation=45,
    ha="right"
)

plt.yticks(
    range(len(model.classes_)),
    model.classes_
)

plt.colorbar()

for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):

        plt.text(
            j,
            i,
            cm[i, j],
            ha="center",
            va="center"
        )

plt.tight_layout()

plt.savefig(
    CM_FILE,
    dpi=200
)

plt.close()


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

print("\n" + "=" * 70)
print("TOP FEATURES")
print("=" * 70)

print(
    importance.head(15)
    .to_string(index=False)
)


# ============================================================
# SAVE MODEL
# ============================================================

artifact = {
    "model": model,
    "features": FEATURES,
    "medians": medians.to_dict(),
    "classes": list(model.classes_),
    "test_accuracy": test_accuracy,
    "test_auc": auc
}

joblib.dump(
    artifact,
    MODEL_FILE
)


print("\n" + "=" * 70)
print("MODEL SAVED")
print("=" * 70)

print(
    f"\nModel:\n{MODEL_FILE}"
)

print(
    f"\nConfusion matrix:\n{CM_FILE}"
)

print("\n" + "=" * 70)
print("TRAINING COMPLETE")
print("=" * 70)
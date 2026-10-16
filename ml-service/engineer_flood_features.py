import pandas as pd
import numpy as np

INPUT_FILE = "data/kerala_daily_flood_dataset.csv"
OUTPUT_FILE = "data/kerala_flood_ml_features.csv"

print("========================================")
print("Flood Feature Engineering")
print("========================================")

df = pd.read_csv(INPUT_FILE)

df["Date"] = pd.to_datetime(df["Date"])

# Sort by district and date
df = df.sort_values(
    ["District", "Date"]
).reset_index(drop=True)


# ============================================
# CALENDAR FEATURES
# ============================================

df["month"] = df["Date"].dt.month

df["day_of_year"] = df["Date"].dt.dayofyear

# Cyclic month encoding
df["month_sin"] = np.sin(
    2 * np.pi * df["month"] / 12
)

df["month_cos"] = np.cos(
    2 * np.pi * df["month"] / 12
)

# Cyclic day-of-year encoding
df["day_of_year_sin"] = np.sin(
    2 * np.pi * df["day_of_year"] / 365.25
)

df["day_of_year_cos"] = np.cos(
    2 * np.pi * df["day_of_year"] / 365.25
)


# ============================================
# KERALA MONSOON INDICATORS
# ============================================

df["southwest_monsoon"] = (
    df["month"].isin([6, 7, 8, 9])
).astype(int)

df["northeast_monsoon"] = (
    df["month"].isin([10, 11, 12])
).astype(int)


# ============================================
# RAINFALL FEATURES
# ============================================

df["rainfall_ratio_3d_7d"] = (
    df["rainfall_3d"] /
    (df["rainfall_7d"] + 0.1)
)

df["rainfall_ratio_7d_14d"] = (
    df["rainfall_7d"] /
    (df["rainfall_14d"] + 0.1)
)

df["rainfall_acceleration"] = (
    df["rainfall_3d"] -
    (
        df["rainfall_7d"] / 7 * 3
    )
)


# ============================================
# TEMPERATURE RANGE
# ============================================

df["temperature_range"] = (
    df["temperature_2m_max"] -
    df["temperature_2m_min"]
)


# ============================================
# PRESSURE FEATURES
# ============================================

df["pressure_drop_3d"] = (
    -df["pressure_change_3d"]
)

df["pressure_drop_1d"] = (
    -df["pressure_change_1d"]
)


# ============================================
# EXTREME WEATHER FLAGS
# ============================================

df["heavy_rain_day"] = (
    df["precipitation_sum"] >= 50
).astype(int)

df["very_heavy_rain_day"] = (
    df["precipitation_sum"] >= 100
).astype(int)

df["extreme_3d_rain"] = (
    df["rainfall_3d"] >= 150
).astype(int)

df["extreme_7d_rain"] = (
    df["rainfall_7d"] >= 250
).astype(int)


# ============================================
# SAVE
# ============================================

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("========================================")
print("FEATURE ENGINEERING COMPLETE")
print("========================================")

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print(f"Output: {OUTPUT_FILE}")

print("\nNew features:")

new_features = [
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

for feature in new_features:
    print(" -", feature)
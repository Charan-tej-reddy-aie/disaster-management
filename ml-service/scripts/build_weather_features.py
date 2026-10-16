from pathlib import Path
import pandas as pd
import numpy as np
import csv


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

INPUT_DIR = BASE_DIR / "data" / "historical_weather_india_batched"

OUTPUT_DIR = BASE_DIR / "data" / "processed"

OUTPUT_FILE = OUTPUT_DIR / "weather_features.csv"


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# REQUIRED COLUMNS
# ============================================================

REQUIRED_COLUMNS = [
    "time",
    "temperature_2m_mean",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "relative_humidity_2m_mean",
    "surface_pressure_mean",
    "wind_speed_10m_mean",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",
    "latitude",
    "longitude",
    "coordinate_id",
    "download_year",
]


# ============================================================
# FIND CSV FILES
# ============================================================

csv_files = sorted(INPUT_DIR.glob("*.csv"))

print("=" * 70)
print("WEATHER FEATURE ENGINEERING")
print("=" * 70)

print(f"Input directory : {INPUT_DIR}")
print(f"CSV files found : {len(csv_files)}")
print(f"Output file     : {OUTPUT_FILE}")
print()


if not csv_files:
    raise FileNotFoundError(
        f"No CSV files found in {INPUT_DIR}"
    )


# ============================================================
# PROCESS EACH CSV
# ============================================================

first_file = True

total_rows = 0
successful_files = 0
failed_files = 0


for index, file_path in enumerate(csv_files, start=1):

    try:

        # ----------------------------------------------------
        # Read CSV
        # ----------------------------------------------------

        df = pd.read_csv(file_path)

        # ----------------------------------------------------
        # Validate columns
        # ----------------------------------------------------

        missing_columns = [
            column
            for column in REQUIRED_COLUMNS
            if column not in df.columns
        ]

        if missing_columns:

            print(
                f"[WARNING] Skipping {file_path.name} "
                f"missing columns: {missing_columns}"
            )

            failed_files += 1
            continue

        # ----------------------------------------------------
        # Convert date
        # ----------------------------------------------------

        df["time"] = pd.to_datetime(
            df["time"],
            errors="coerce"
        )

        df = df.dropna(subset=["time"])

        # ----------------------------------------------------
        # Sort chronologically
        # ----------------------------------------------------

        df = df.sort_values("time").reset_index(drop=True)

        # ----------------------------------------------------
        # Convert numerical columns
        # ----------------------------------------------------

        numeric_columns = [
            "temperature_2m_mean",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "relative_humidity_2m_mean",
            "surface_pressure_mean",
            "wind_speed_10m_mean",
            "wind_speed_10m_max",
            "wind_direction_10m_dominant",
            "latitude",
            "longitude",
        ]

        for column in numeric_columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

        # ----------------------------------------------------
        # Basic missing-value handling
        # ----------------------------------------------------

        df[numeric_columns] = (
            df[numeric_columns]
            .interpolate(limit_direction="both")
        )

        # ----------------------------------------------------
        # BASIC WEATHER FEATURES
        # ----------------------------------------------------

        df["temperature_range"] = (
            df["temperature_2m_max"]
            -
            df["temperature_2m_min"]
        )

        # ----------------------------------------------------
        # RAINFALL FEATURES
        # ----------------------------------------------------

        # Current day rainfall
        df["rainfall_1d"] = (
            df["precipitation_sum"]
        )

        # Previous 3-day accumulated rainfall
        df["rainfall_3d"] = (
            df["precipitation_sum"]
            .rolling(window=3, min_periods=1)
            .sum()
        )

        # Previous 7-day accumulated rainfall
        df["rainfall_7d"] = (
            df["precipitation_sum"]
            .rolling(window=7, min_periods=1)
            .sum()
        )

        # Previous 14-day accumulated rainfall
        df["rainfall_14d"] = (
            df["precipitation_sum"]
            .rolling(window=14, min_periods=1)
            .sum()
        )

        # ----------------------------------------------------
        # RAINFALL INTENSITY
        # ----------------------------------------------------

        df["rainfall_3d_mean"] = (
            df["precipitation_sum"]
            .rolling(window=3, min_periods=1)
            .mean()
        )

        df["rainfall_7d_mean"] = (
            df["precipitation_sum"]
            .rolling(window=7, min_periods=1)
            .mean()
        )

        # ----------------------------------------------------
        # HUMIDITY FEATURES
        # ----------------------------------------------------

        df["humidity_3d_mean"] = (
            df["relative_humidity_2m_mean"]
            .rolling(window=3, min_periods=1)
            .mean()
        )

        df["humidity_7d_mean"] = (
            df["relative_humidity_2m_mean"]
            .rolling(window=7, min_periods=1)
            .mean()
        )

        # ----------------------------------------------------
        # TEMPERATURE FEATURES
        # ----------------------------------------------------

        df["temperature_3d_mean"] = (
            df["temperature_2m_mean"]
            .rolling(window=3, min_periods=1)
            .mean()
        )

        df["temperature_7d_mean"] = (
            df["temperature_2m_mean"]
            .rolling(window=7, min_periods=1)
            .mean()
        )

        # ----------------------------------------------------
        # WIND FEATURES
        # ----------------------------------------------------

        df["wind_3d_mean"] = (
            df["wind_speed_10m_mean"]
            .rolling(window=3, min_periods=1)
            .mean()
        )

        df["wind_7d_mean"] = (
            df["wind_speed_10m_mean"]
            .rolling(window=7, min_periods=1)
            .mean()
        )

        df["wind_max_7d"] = (
            df["wind_speed_10m_max"]
            .rolling(window=7, min_periods=1)
            .max()
        )

        # ----------------------------------------------------
        # PRESSURE CHANGE
        # ----------------------------------------------------

        df["pressure_change_1d"] = (
            df["surface_pressure_mean"]
            -
            df["surface_pressure_mean"].shift(1)
        )

        df["pressure_change_3d"] = (
            df["surface_pressure_mean"]
            -
            df["surface_pressure_mean"].shift(3)
        )

        # ----------------------------------------------------
        # CALENDAR FEATURES
        # ----------------------------------------------------

        df["year"] = df["time"].dt.year

        df["month"] = df["time"].dt.month

        df["day"] = df["time"].dt.day

        df["day_of_year"] = (
            df["time"].dt.dayofyear
        )

        # ----------------------------------------------------
        # SEASON
        # ----------------------------------------------------

        def get_season(month):

            if month in [12, 1, 2]:
                return "WINTER"

            if month in [3, 4, 5]:
                return "SUMMER"

            if month in [6, 7, 8, 9]:
                return "MONSOON"

            return "POST_MONSOON"

        df["season"] = df["month"].apply(get_season)

        # ----------------------------------------------------
        # SOURCE FILE
        # ----------------------------------------------------

        df["source_file"] = file_path.name

        # ----------------------------------------------------
        # SELECT FINAL COLUMNS
        # ----------------------------------------------------

        final_columns = [
            "time",

            "latitude",
            "longitude",
            "coordinate_id",

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

            "wind_direction_10m_dominant",

            "year",
            "month",
            "day",
            "day_of_year",
            "season",

            "download_year",

            "source_file",
        ]

        df = df[final_columns]

        # ----------------------------------------------------
        # WRITE OUTPUT
        # ----------------------------------------------------

        df.to_csv(
            OUTPUT_FILE,
            mode="w" if first_file else "a",
            header=first_file,
            index=False
        )

        first_file = False

        total_rows += len(df)

        successful_files += 1

        # ----------------------------------------------------
        # PROGRESS
        # ----------------------------------------------------

        if (
            index == 1
            or index % 100 == 0
            or index == len(csv_files)
        ):

            print(
                f"[{index}/{len(csv_files)}] "
                f"Processed: {file_path.name} "
                f"| Rows: {len(df):,} "
                f"| Total rows: {total_rows:,}"
            )

    except Exception as error:

        failed_files += 1

        print(
            f"[ERROR] {file_path.name}: {error}"
        )


# ============================================================
# SUMMARY
# ============================================================

print()
print("=" * 70)
print("FEATURE ENGINEERING COMPLETE")
print("=" * 70)

print(f"Total CSV files : {len(csv_files):,}")
print(f"Successful      : {successful_files:,}")
print(f"Failed          : {failed_files:,}")
print(f"Total rows      : {total_rows:,}")

print()
print("Output:")
print(OUTPUT_FILE)
print("=" * 70)
import pandas as pd
import os
import glob

# ============================================
# FILE PATHS
# ============================================

FLOOD_FILE = "data/kerala_flood_event_districts_clean.csv"
WEATHER_DIR = "data/historical_weather"

OUTPUT_FILE = "data/kerala_daily_flood_dataset.csv"


# ============================================
# LOAD FLOOD EVENTS
# ============================================

print("========================================")
print("Loading flood events")
print("========================================")

floods = pd.read_csv(FLOOD_FILE)

floods["Start Date"] = pd.to_datetime(
    floods["Start Date"],
    errors="coerce"
)

floods["End Date"] = pd.to_datetime(
    floods["End Date"],
    errors="coerce"
)

# Keep only required columns
floods = floods[
    [
        "UEI",
        "Start Date",
        "End Date",
        "District"
    ]
].dropna(
    subset=["Start Date", "End Date", "District"]
)

print(f"Flood event-district records: {len(floods)}")


# ============================================
# CREATE DAILY FLOOD TARGET
# ============================================

print("\nCreating flood date lookup...")

flood_lookup = {}

for _, row in floods.iterrows():

    district = row["District"]

    start = row["Start Date"]
    end = row["End Date"]

    if district not in flood_lookup:
        flood_lookup[district] = set()

    dates = pd.date_range(
        start=start,
        end=end,
        freq="D"
    )

    for date in dates:
        flood_lookup[district].add(
            date.normalize()
        )


print("Flood lookup created.")


# ============================================
# LOAD WEATHER DATA
# ============================================

weather_files = []

district_names = [
    "alappuzha",
    "ernakulam",
    "idukki",
    "kannur",
    "kasaragod",
    "kollam",
    "kottayam",
    "kozhikode",
    "malappuram",
    "palakkad",
    "pathanamthitta",
    "thiruvananthapuram",
    "thrissur",
    "wayanad"
]

for district in district_names:

    file = os.path.join(
        WEATHER_DIR,
        f"{district}.csv"
    )

    if os.path.exists(file):
        weather_files.append(file)
    else:
        print(f"❌ Missing weather file: {file}")


print(f"\nWeather files found: {len(weather_files)}")


# ============================================
# PROCESS EACH DISTRICT
# ============================================

all_district_data = []

for file in weather_files:

    print("\n----------------------------------------")

    district = os.path.basename(file).replace(
        ".csv",
        ""
    )

    print(f"Processing: {district}")

    df = pd.read_csv(file)

    # Convert date
    df["Date"] = pd.to_datetime(
        df["time"],
        errors="coerce"
    )

    # Sort by date
    df = df.sort_values(
        "Date"
    ).reset_index(drop=True)

    # ========================================
    # WEATHER FEATURES
    # ========================================

    rainfall = df["precipitation_sum"]

    # Previous rainfall
    df["rainfall_1d"] = rainfall

    df["rainfall_3d"] = (
        rainfall
        .rolling(window=3, min_periods=1)
        .sum()
    )

    df["rainfall_7d"] = (
        rainfall
        .rolling(window=7, min_periods=1)
        .sum()
    )

    df["rainfall_14d"] = (
        rainfall
        .rolling(window=14, min_periods=1)
        .sum()
    )

    df["rainfall_max_3d"] = (
        rainfall
        .rolling(window=3, min_periods=1)
        .max()
    )

    df["rainfall_max_7d"] = (
        rainfall
        .rolling(window=7, min_periods=1)
        .max()
    )

    # ========================================
    # HUMIDITY FEATURES
    # ========================================

    humidity = df[
        "relative_humidity_2m_mean"
    ]

    df["humidity_3d_mean"] = (
        humidity
        .rolling(window=3, min_periods=1)
        .mean()
    )

    df["humidity_7d_mean"] = (
        humidity
        .rolling(window=7, min_periods=1)
        .mean()
    )

    # ========================================
    # PRESSURE FEATURES
    # ========================================

    pressure = df[
        "pressure_msl_mean"
    ]

    df["pressure_change_1d"] = (
        pressure.diff()
    )

    df["pressure_change_3d"] = (
        pressure.diff(3)
    )

    # ========================================
    # FLOOD LABEL
    # ========================================

    flood_dates = flood_lookup.get(
        district.title(),
        set()
    )

    # Today's recorded flood status
    df["Flood_Today"] = df["Date"].apply(
        lambda x: int(
            x.normalize() in flood_dates
        )
    )

    # Future flood within next 3 days
    def future_flood(date):

        for offset in range(1, 4):

            future_date = (
                date + pd.Timedelta(days=offset)
            ).normalize()

            if future_date in flood_dates:
                return 1

        return 0

    df["Flood_Next_3_Days"] = df["Date"].apply(
        future_flood
    )

    # ========================================
    # SELECT FINAL COLUMNS
    # ========================================

    final_columns = [
        "District",
        "Date",

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

        "Flood_Today",
        "Flood_Next_3_Days"
    ]

    df = df[final_columns]

    all_district_data.append(df)

    print(f"Rows: {len(df)}")
    print(
        f"Flood next 3 days: "
        f"{df['Flood_Next_3_Days'].sum()}"
    )


# ============================================
# COMBINE ALL DISTRICTS
# ============================================

print("\n========================================")
print("Combining districts")
print("========================================")

final_df = pd.concat(
    all_district_data,
    ignore_index=True
)

# Sort
final_df = final_df.sort_values(
    ["District", "Date"]
).reset_index(drop=True)


# ============================================
# HANDLE MISSING VALUES
# ============================================

print("\nMissing values before cleaning:")

print(
    final_df.isnull().sum()
)

# Rolling features at beginning of dataset
# can contain NaN because pressure diff needs
# previous days.

final_df = final_df.dropna(
    subset=[
        "temperature_2m_mean",
        "relative_humidity_2m_mean",
        "precipitation_sum",
        "pressure_msl_mean",
        "wind_speed_10m_mean"
    ]
)


# Fill feature differences
final_df[
    [
        "pressure_change_1d",
        "pressure_change_3d"
    ]
] = final_df[
    [
        "pressure_change_1d",
        "pressure_change_3d"
    ]
].fillna(0)


# ============================================
# SAVE
# ============================================

final_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n========================================")
print("DATASET CREATED")
print("========================================")

print(f"Output: {OUTPUT_FILE}")
print(f"Rows: {len(final_df)}")
print(f"Columns: {len(final_df.columns)}")

print("\nTarget distribution:")

print(
    final_df["Flood_Next_3_Days"].value_counts()
)

print("\nTarget percentage:")

print(
    final_df["Flood_Next_3_Days"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)

print("\nDistrict distribution:")

print(
    final_df["District"].value_counts()
)

print("\nDate range:")

print(
    final_df["Date"].min(),
    "→",
    final_df["Date"].max()
)
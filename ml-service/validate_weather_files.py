import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WEATHER_DIR = os.path.join(
    BASE_DIR,
    "data",
    "historical_weather_india_batched"
)

REQUIREMENTS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_weather_requirements_final.csv"
)

REPORT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "weather_validation_report.csv"
)

EXPECTED_COLUMNS = [
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
    "download_year"
]


print("=" * 70)
print("HISTORICAL WEATHER FILE VALIDATION")
print("=" * 70)

print("\nWeather directory:")
print(WEATHER_DIR)


# ============================================================
# CHECK DIRECTORY
# ============================================================

if not os.path.exists(WEATHER_DIR):

    print("\nERROR: Weather directory does not exist.")

    raise SystemExit


# ============================================================
# LOAD REQUIREMENTS
# ============================================================

requirements = pd.read_csv(
    REQUIREMENTS_FILE
)

requirements["coordinate_id"] = (
    requirements["latitude"].round(5).astype(str)
    + "|"
    + requirements["longitude"].round(5).astype(str)
)

requirements["First_Flood_Year"] = (
    requirements["First_Flood_Year"].astype(int)
)

requirements["Last_Flood_Year"] = (
    requirements["Last_Flood_Year"].astype(int)
)


# ============================================================
# GET WEATHER FILES
# ============================================================

files = [
    file
    for file in os.listdir(WEATHER_DIR)
    if file.lower().endswith(".csv")
]


print(
    f"\nWeather files found: {len(files)}"
)


# ============================================================
# VALIDATION
# ============================================================

results = []

valid_count = 0
invalid_count = 0
empty_count = 0
wrong_year_count = 0
missing_column_count = 0
bad_date_count = 0
bad_coordinate_count = 0


for index, filename in enumerate(
    sorted(files),
    start=1
):

    filepath = os.path.join(
        WEATHER_DIR,
        filename
    )

    result = {
        "file": filename,
        "status": "VALID",
        "records": 0,
        "year": None,
        "min_date": None,
        "max_date": None,
        "missing_columns": "",
        "coordinate_id": None,
        "latitude": None,
        "longitude": None,
        "message": ""
    }


    # ========================================================
    # READ FILE
    # ========================================================

    try:

        df = pd.read_csv(
            filepath
        )

    except Exception as error:

        result["status"] = "INVALID"
        result["message"] = (
            f"Read error: {error}"
        )

        invalid_count += 1
        results.append(result)

        continue


    # ========================================================
    # EMPTY FILE
    # ========================================================

    if df.empty:

        result["status"] = "EMPTY"
        result["message"] = "File contains no rows."

        empty_count += 1
        results.append(result)

        continue


    result["records"] = len(df)


    # ========================================================
    # CHECK COLUMNS
    # ========================================================

    missing = [
        column
        for column in EXPECTED_COLUMNS
        if column not in df.columns
    ]

    if missing:

        result["status"] = "MISSING_COLUMNS"

        result["missing_columns"] = (
            ",".join(missing)
        )

        result["message"] = (
            "Required columns are missing."
        )

        missing_column_count += 1
        invalid_count += 1

        results.append(result)

        continue


    # ========================================================
    # DATE
    # ========================================================

    df["time"] = pd.to_datetime(
        df["time"],
        errors="coerce"
    )

    if df["time"].isna().any():

        result["status"] = "BAD_DATE"
        result["message"] = (
            "One or more invalid dates."
        )

        bad_date_count += 1
        invalid_count += 1

        results.append(result)

        continue


    result["min_date"] = (
        df["time"].min().strftime("%Y-%m-%d")
    )

    result["max_date"] = (
        df["time"].max().strftime("%Y-%m-%d")
    )


    # ========================================================
    # YEAR FROM FILE DATA
    # ========================================================

    unique_years = (
        df["time"]
        .dt.year
        .unique()
        .tolist()
    )

    unique_years = sorted(
        int(year)
        for year in unique_years
    )


    if len(unique_years) != 1:

        result["status"] = "MULTIPLE_YEARS"

        result["message"] = (
            f"Contains years: {unique_years}"
        )

        wrong_year_count += 1
        invalid_count += 1

        results.append(result)

        continue


    data_year = unique_years[0]

    result["year"] = data_year


    # ========================================================
    # CHECK COORDINATES
    # ========================================================

    latitude_values = (
        df["latitude"]
        .dropna()
        .unique()
    )

    longitude_values = (
        df["longitude"]
        .dropna()
        .unique()
    )

    coordinate_values = (
        df["coordinate_id"]
        .dropna()
        .unique()
    )


    if (
        len(latitude_values) != 1
        or len(longitude_values) != 1
        or len(coordinate_values) != 1
    ):

        result["status"] = "BAD_COORDINATES"

        result["message"] = (
            "Multiple or missing coordinate values."
        )

        bad_coordinate_count += 1
        invalid_count += 1

        results.append(result)

        continue


    result["latitude"] = (
        latitude_values[0]
    )

    result["longitude"] = (
        longitude_values[0]
    )

    result["coordinate_id"] = (
        coordinate_values[0]
    )


    # ========================================================
    # CHECK RECORD COUNT
    # ========================================================

    expected_records = 366 if (
        pd.Timestamp(
            f"{data_year}-12-31"
        ).dayofyear == 366
    ) else 365


    if len(df) not in [
        expected_records,
        expected_records - 1
    ]:

        result["status"] = "UNEXPECTED_RECORD_COUNT"

        result["message"] = (
            f"Expected approximately "
            f"{expected_records} records, "
            f"found {len(df)}."
        )

        invalid_count += 1

        results.append(result)

        continue


    # ========================================================
    # CHECK DATE RANGE
    # ========================================================

    expected_start = pd.Timestamp(
        f"{data_year}-01-01"
    )

    expected_end = pd.Timestamp(
        f"{data_year}-12-31"
    )

    actual_start = df["time"].min()
    actual_end = df["time"].max()


    if (
        actual_start != expected_start
        or actual_end != expected_end
    ):

        result["status"] = "INCOMPLETE_DATE_RANGE"

        result["message"] = (
            f"Expected "
            f"{expected_start.date()} → "
            f"{expected_end.date()}, "
            f"found "
            f"{actual_start.date()} → "
            f"{actual_end.date()}"
        )

        invalid_count += 1

        results.append(result)

        continue


    # ========================================================
    # CHECK DUPLICATE DATES
    # ========================================================

    if df["time"].duplicated().any():

        result["status"] = "DUPLICATE_DATES"

        result["message"] = (
            "Duplicate dates found."
        )

        invalid_count += 1

        results.append(result)

        continue


    # ========================================================
    # CHECK WEATHER VARIABLES
    # ========================================================

    weather_columns = [
        "temperature_2m_mean",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "relative_humidity_2m_mean",
        "surface_pressure_mean",
        "wind_speed_10m_mean",
        "wind_speed_10m_max",
        "wind_direction_10m_dominant"
    ]


    numeric_problem = False

    for column in weather_columns:

        converted = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        if converted.isna().all():

            numeric_problem = True

            result["message"] = (
                f"Weather variable "
                f"{column} contains no valid values."
            )

            break


    if numeric_problem:

        result["status"] = "BAD_WEATHER_DATA"

        invalid_count += 1

        results.append(result)

        continue


    # ========================================================
    # VALID
    # ========================================================

    valid_count += 1

    results.append(result)


    if index % 100 == 0:

        print(
            f"Checked {index}/{len(files)} files..."
        )


# ============================================================
# SAVE REPORT
# ============================================================

report = pd.DataFrame(
    results
)

report.to_csv(
    REPORT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("VALIDATION SUMMARY")
print("=" * 70)

print(
    f"\nTotal files:           {len(files)}"
)

print(
    f"Valid files:           {valid_count}"
)

print(
    f"Invalid files:         {invalid_count}"
)

print(
    f"Empty files:           {empty_count}"
)

print(
    f"Wrong year structure:  {wrong_year_count}"
)

print(
    f"Missing columns:       {missing_column_count}"
)

print(
    f"Bad dates:             {bad_date_count}"
)

print(
    f"Bad coordinates:       {bad_coordinate_count}"
)


# ============================================================
# INVALID FILES
# ============================================================

invalid = report[
    report["status"] != "VALID"
]

if not invalid.empty:

    print("\nInvalid files:")

    print(
        invalid[
            [
                "file",
                "status",
                "records",
                "message"
            ]
        ].to_string(
            index=False
        )
    )


print("\nValidation report saved to:")

print(
    REPORT_FILE
)

print("\nDone.")
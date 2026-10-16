import os
import time
import requests
import pandas as pd
from datetime import datetime


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PLAN_FILE = os.path.join(
    BASE_DIR,
    "data",
    "weather_download_remaining.csv"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "data",
    "historical_weather_india_batched"
)

PROGRESS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "weather_batched_progress.csv"
)

FAILED_FILE = os.path.join(
    BASE_DIR,
    "data",
    "weather_batched_failed.csv"
)

API_URL = (
    "https://archive-api.open-meteo.com/v1/era5"
)


# ============================================================
# SETTINGS
# ============================================================

# TRUE = test only
# FALSE = actually download
DRY_RUN = False

# Maximum coordinates in one API request
COORDINATES_PER_BATCH = 25

# Seconds between successful API requests
REQUEST_DELAY = 5

# Timeout for one API request
REQUEST_TIMEOUT = 120

# Retry temporary network errors
MAX_NETWORK_RETRIES = 3

# IMPORTANT:
# After HTTP 429, wait this many seconds before retrying.
# The provider may require a much longer wait.
RATE_LIMIT_WAIT = 3600


# ============================================================
# WEATHER VARIABLES
# ============================================================

DAILY_VARIABLES = [
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


# ============================================================
# CREATE DIRECTORIES
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# LOAD PLAN
# ============================================================

print("=" * 70)
print("RESUMABLE INDIA HISTORICAL WEATHER DOWNLOADER")
print("=" * 70)

print("\nLoading download plan...")

if not os.path.exists(PLAN_FILE):

    raise FileNotFoundError(
        f"Download plan not found:\n{PLAN_FILE}"
    )


plan = pd.read_csv(
    PLAN_FILE
)

print(
    f"Jobs in download plan: {len(plan):,}"
)


# ============================================================
# VALIDATE PLAN
# ============================================================

required_columns = [
    "State",
    "District",
    "coordinate_id",
    "latitude",
    "longitude",
    "year"
]

missing_columns = [
    column
    for column in required_columns
    if column not in plan.columns
]

if missing_columns:

    raise ValueError(
        "Missing columns in download plan: "
        + str(missing_columns)
    )


plan["year"] = (
    plan["year"]
    .astype(int)
)


# ============================================================
# OUTPUT FILE FUNCTION
# ============================================================

def output_filename(
    coordinate_id,
    year
):

    safe_id = (
        str(coordinate_id)
        .replace("|", "_")
        .replace(" ", "_")
    )

    return os.path.join(
        OUTPUT_DIR,
        f"{safe_id}_{year}.csv"
    )


# ============================================================
# CHECK EXISTING FILE
# ============================================================

def file_exists(
    coordinate_id,
    year
):

    return os.path.exists(
        output_filename(
            coordinate_id,
            year
        )
    )


# ============================================================
# SAVE PROGRESS
# ============================================================

def save_progress(
    coordinate,
    year,
    records,
    filename
):

    exists = os.path.exists(
        PROGRESS_FILE
    )

    row = {

        "coordinate_id":
            coordinate["coordinate_id"],

        "latitude":
            coordinate["latitude"],

        "longitude":
            coordinate["longitude"],

        "year":
            year,

        "status":
            "SUCCESS",

        "records":
            records,

        "file":
            filename,

        "timestamp":
            datetime.now().isoformat()
    }

    pd.DataFrame(
        [row]
    ).to_csv(
        PROGRESS_FILE,
        mode="a",
        header=not exists,
        index=False
    )


# ============================================================
# SAVE FAILURE
# ============================================================

def save_failure(
    coordinate,
    year,
    reason
):

    exists = os.path.exists(
        FAILED_FILE
    )

    row = {

        "coordinate_id":
            coordinate["coordinate_id"],

        "latitude":
            coordinate["latitude"],

        "longitude":
            coordinate["longitude"],

        "year":
            year,

        "status":
            "FAILED",

        "reason":
            reason,

        "timestamp":
            datetime.now().isoformat()
    }

    pd.DataFrame(
        [row]
    ).to_csv(
        FAILED_FILE,
        mode="a",
        header=not exists,
        index=False
    )


# ============================================================
# REMOVE ALREADY COMPLETED JOBS
# ============================================================

remaining_jobs = []

for _, row in plan.iterrows():

    coordinate_id = row[
        "coordinate_id"
    ]

    year = int(
        row["year"]
    )

    if not file_exists(
        coordinate_id,
        year
    ):

        remaining_jobs.append(
            row.to_dict()
        )


print(
    f"\nAlready downloaded: "
    f"{len(plan) - len(remaining_jobs):,}"
)

print(
    f"Remaining: "
    f"{len(remaining_jobs):,}"
)


# ============================================================
# DRY RUN
# ============================================================

if DRY_RUN:

    print("\n" + "=" * 70)
    print("DRY RUN MODE")
    print("=" * 70)

    print(
        "\nNo API requests will be made."
    )

    print(
        f"Remaining jobs: "
        f"{len(remaining_jobs):,}"
    )

    print(
        f"Batch size: "
        f"{COORDINATES_PER_BATCH}"
    )

    if remaining_jobs:

        preview = pd.DataFrame(
            remaining_jobs
        )

        print(
            "\nFirst 20 remaining jobs:"
        )

        print(
            preview.head(20).to_string(
                index=False
            )
        )

    print(
        "\nDry run completed."
    )

    raise SystemExit


# ============================================================
# GROUP JOBS BY YEAR
# ============================================================

jobs_by_year = {}

for job in remaining_jobs:

    year = int(
        job["year"]
    )

    if year not in jobs_by_year:

        jobs_by_year[year] = []

    jobs_by_year[year].append(
        job
    )


# ============================================================
# API REQUEST
# ============================================================

def request_weather(
    batch,
    year
):

    latitudes = [
        str(
            job["latitude"]
        )
        for job in batch
    ]

    longitudes = [
        str(
            job["longitude"]
        )
        for job in batch
    ]

    params = {

        "latitude":
            ",".join(latitudes),

        "longitude":
            ",".join(longitudes),

        "start_date":
            f"{year}-01-01",

        "end_date":
            f"{year}-12-31",

        "daily":
            ",".join(
                DAILY_VARIABLES
            ),

        "timezone":
            "Asia/Kolkata",

        "models":
            "era5"
    }


    network_attempt = 0


    while True:

        try:

            response = requests.get(
                API_URL,
                params=params,
                timeout=REQUEST_TIMEOUT
            )


            # =================================================
            # RATE LIMIT
            # =================================================

            if response.status_code == 429:

                print("\n" + "!" * 70)

                print(
                    "HTTP 429 - OPEN-METEO RATE LIMIT"
                )

                print(
                    f"Waiting {RATE_LIMIT_WAIT} seconds."
                )

                print(
                    "The downloader will then retry"
                    " the SAME batch."
                )

                print(
                    "No completed files will be lost."
                )

                print("!" * 70)


                time.sleep(
                    RATE_LIMIT_WAIT
                )

                continue


            # =================================================
            # OTHER HTTP ERRORS
            # =================================================

            response.raise_for_status()

            return response.json()


        except requests.exceptions.Timeout:

            network_attempt += 1

            print(
                f"\nTimeout "
                f"{network_attempt}/"
                f"{MAX_NETWORK_RETRIES}"
            )


        except requests.exceptions.ConnectionError:

            network_attempt += 1

            print(
                f"\nConnection error "
                f"{network_attempt}/"
                f"{MAX_NETWORK_RETRIES}"
            )


        except requests.exceptions.HTTPError as error:

            print(
                f"\nHTTP error: {error}"
            )

            return None


        except Exception as error:

            print(
                f"\nUnexpected error: {error}"
            )

            return None


        if network_attempt >= MAX_NETWORK_RETRIES:

            print(
                "\nMaximum temporary-error "
                "retries reached."
            )

            return None


        wait_time = (
            30 * network_attempt
        )

        print(
            f"Waiting {wait_time} seconds..."
        )

        time.sleep(
            wait_time
        )


# ============================================================
# PROCESS API RESPONSE
# ============================================================

def process_response(
    response,
    batch,
    year
):

    if response is None:

        return False


    # Multiple coordinates normally return
    # a list of response objects.

    if isinstance(
        response,
        dict
    ):

        response = [
            response
        ]


    if len(response) != len(batch):

        print(
            "\nERROR:"
        )

        print(
            f"Requested locations: "
            f"{len(batch)}"
        )

        print(
            f"Received locations: "
            f"{len(response)}"
        )

        return False


    for index, weather_data in enumerate(
        response
    ):

        coordinate = batch[index]

        daily = weather_data.get(
            "daily"
        )


        if not daily:

            print(
                f"No daily data for "
                f"{coordinate['coordinate_id']}"
            )

            save_failure(
                coordinate,
                year,
                "No daily data"
            )

            continue


        weather_df = pd.DataFrame(
            daily
        )


        # =====================================================
        # ADD IDENTIFICATION INFORMATION
        # =====================================================

        weather_df["latitude"] = (
            coordinate["latitude"]
        )

        weather_df["longitude"] = (
            coordinate["longitude"]
        )

        weather_df["coordinate_id"] = (
            coordinate["coordinate_id"]
        )

        weather_df["download_year"] = (
            year
        )


        # =====================================================
        # SAVE FILE
        # =====================================================

        filename = output_filename(
            coordinate["coordinate_id"],
            year
        )


        weather_df.to_csv(
            filename,
            index=False
        )


        # =====================================================
        # LOG SUCCESS
        # =====================================================

        save_progress(
            coordinate,
            year,
            len(weather_df),
            filename
        )


        print(
            f"  Saved: "
            f"{coordinate['coordinate_id']}"
            f" | {year}"
            f" | {len(weather_df)} days"
        )


    return True


# ============================================================
# MAIN DOWNLOAD LOOP
# ============================================================

print("\n" + "=" * 70)
print("DOWNLOAD STARTED")
print("=" * 70)

total_remaining = len(
    remaining_jobs
)

completed = 0


for year in sorted(
    jobs_by_year.keys()
):

    year_jobs = jobs_by_year[
        year
    ]


    # Recheck files because jobs may have
    # been completed during a previous run.

    year_jobs = [
        job
        for job in year_jobs
        if not file_exists(
            job["coordinate_id"],
            year
        )
    ]


    if not year_jobs:

        print(
            f"\nYEAR {year}: "
            f"already complete"
        )

        continue


    total_batches = (
        len(year_jobs)
        + COORDINATES_PER_BATCH
        - 1
    ) // COORDINATES_PER_BATCH


    print("\n" + "=" * 70)

    print(
        f"YEAR: {year}"
    )

    print(
        f"Jobs: {len(year_jobs)}"
    )

    print(
        f"Batches: {total_batches}"
    )

    print("=" * 70)


    for start in range(
        0,
        len(year_jobs),
        COORDINATES_PER_BATCH
    ):

        batch = year_jobs[
            start:
            start
            + COORDINATES_PER_BATCH
        ]


        batch_number = (
            start
            // COORDINATES_PER_BATCH
            + 1
        )


        print(
            f"\nBatch "
            f"{batch_number}/"
            f"{total_batches}"
        )

        print(
            f"Year: {year}"
        )

        print(
            f"Coordinates: {len(batch)}"
        )


        # =====================================================
        # REQUEST
        # =====================================================

        response = request_weather(
            batch,
            year
        )


        # =====================================================
        # FAILED REQUEST
        # =====================================================

        if response is None:

            print(
                "Batch failed."
            )

            for job in batch:

                save_failure(
                    job,
                    year,
                    "API request failed"
                )

            continue


        # =====================================================
        # PROCESS RESPONSE
        # =====================================================

        success = process_response(
            response,
            batch,
            year
        )


        if success:

            completed += len(batch)

            print(
                f"\nBatch completed."
            )

            print(
                f"Progress: "
                f"{completed}/"
                f"{total_remaining}"
            )

        else:

            print(
                "\nBatch processing failed."
            )


        # =====================================================
        # DELAY
        # =====================================================

        time.sleep(
            REQUEST_DELAY
        )


# ============================================================
# FINAL STATUS
# ============================================================

actual_completed = 0

for _, row in plan.iterrows():

    if file_exists(
        row["coordinate_id"],
        int(row["year"])
    ):

        actual_completed += 1


actual_remaining = (
    len(plan)
    - actual_completed
)


print("\n" + "=" * 70)
print("DOWNLOAD SESSION FINISHED")
print("=" * 70)

print(
    f"\nTotal required in plan: "
    f"{len(plan):,}"
)

print(
    f"Completed files: "
    f"{actual_completed:,}"
)

print(
    f"Remaining files: "
    f"{actual_remaining:,}"
)

print(
    "\nWeather directory:"
)

print(
    OUTPUT_DIR
)

print(
    "\nYou can safely run this script again."
)

print(
    "Existing files will automatically be skipped."
)

print("=" * 70)
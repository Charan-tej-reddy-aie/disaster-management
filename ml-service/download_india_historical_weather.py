from pathlib import Path
import pandas as pd
import requests
import time
import random
from datetime import datetime


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

REQUIREMENTS_FILE = (
    BASE_DIR
    / "data"
    / "india_weather_requirements_final.csv"
)

OUTPUT_DIR = (
    BASE_DIR
    / "data"
    / "historical_weather_india"
)

PROGRESS_FILE = (
    BASE_DIR
    / "data"
    / "historical_weather_india_progress.csv"
)

FAILED_FILE = (
    BASE_DIR
    / "data"
    / "historical_weather_india_failed.csv"
)


# ============================================================
# OPEN-METEO
# ============================================================

API_URL = "https://archive-api.open-meteo.com/v1/era5"


# ============================================================
# WEATHER PERIOD
# ============================================================

MIN_DATE = pd.Timestamp("1971-01-01")
MAX_DATE = pd.Timestamp("2023-12-31")


# ============================================================
# REQUEST SETTINGS
# ============================================================

REQUEST_TIMEOUT = 60

MAX_RETRIES = 6

# Minimum delay between successful requests
MIN_DELAY = 3

# Maximum delay after rate limiting
MAX_BACKOFF = 300


# ============================================================
# DAILY VARIABLES
# ============================================================

DAILY_VARIABLES = [
    "temperature_2m_mean",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "rain_sum",
    "relative_humidity_2m_mean",
    "surface_pressure_mean",
    "wind_speed_10m_mean",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",
]


# ============================================================
# CREATE DIRECTORIES
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# LOAD REQUIREMENTS
# ============================================================

if not REQUIREMENTS_FILE.exists():

    raise FileNotFoundError(
        f"\nRequirements file not found:\n"
        f"{REQUIREMENTS_FILE}"
    )


requirements = pd.read_csv(
    REQUIREMENTS_FILE
)


print("=" * 70)
print("INDIA HISTORICAL WEATHER DOWNLOADER")
print("=" * 70)

print(
    f"\nDistricts to process: "
    f"{len(requirements):,}"
)


# ============================================================
# CHECK COLUMNS
# ============================================================

required_columns = [
    "State",
    "District",
    "latitude",
    "longitude",
    "First_Flood_Date",
    "Last_Flood_Date",
]

missing = [
    c
    for c in required_columns
    if c not in requirements.columns
]

if missing:

    raise ValueError(
        f"\nMissing required columns: {missing}"
    )


# ============================================================
# DATE CONVERSION
# ============================================================

requirements["First_Flood_Date"] = pd.to_datetime(
    requirements["First_Flood_Date"],
    errors="coerce"
)

requirements["Last_Flood_Date"] = pd.to_datetime(
    requirements["Last_Flood_Date"],
    errors="coerce"
)


# ============================================================
# HELPERS
# ============================================================

def safe_filename(state, district):

    text = f"{state}_{district}"

    invalid_chars = '<>:"/\\|?*'

    for char in invalid_chars:
        text = text.replace(char, "_")

    text = (
        text
        .replace(" ", "_")
        .replace(",", "")
        .replace("&", "and")
    )

    return text


def district_id(state, district):

    return f"{state}|{district}"


# ============================================================
# REQUEST SESSION
# ============================================================

session = requests.Session()

session.headers.update({
    "User-Agent":
        "National-Disaster-Management-ML/1.0"
})


# ============================================================
# DOWNLOAD ONE YEAR
# ============================================================

def download_year(
    latitude,
    longitude,
    start_date,
    end_date
):

    params = {

        "latitude": latitude,

        "longitude": longitude,

        "start_date":
            start_date.strftime("%Y-%m-%d"),

        "end_date":
            end_date.strftime("%Y-%m-%d"),

        "daily":
            ",".join(DAILY_VARIABLES),

        "timezone":
            "Asia/Kolkata",

        "temperature_unit":
            "celsius",

        "wind_speed_unit":
            "kmh",

        "precipitation_unit":
            "mm",

        "models":
            "era5",
    }


    for attempt in range(1, MAX_RETRIES + 1):

        try:

            response = session.get(
                API_URL,
                params=params,
                timeout=REQUEST_TIMEOUT
            )


            # ------------------------------------------------
            # RATE LIMIT
            # ------------------------------------------------

            if response.status_code == 429:

                retry_after = response.headers.get(
                    "Retry-After"
                )

                if retry_after:

                    try:
                        wait = float(retry_after)

                    except:
                        wait = min(
                            30 * (2 ** (attempt - 1)),
                            MAX_BACKOFF
                        )

                else:

                    wait = min(
                        30 * (2 ** (attempt - 1)),
                        MAX_BACKOFF
                    )

                # Add small randomness
                wait += random.uniform(1, 5)

                print(
                    f"      429 rate limit. "
                    f"Waiting {wait:.1f}s "
                    f"(attempt {attempt}/{MAX_RETRIES})"
                )

                time.sleep(wait)

                continue


            # ------------------------------------------------
            # OTHER HTTP ERRORS
            # ------------------------------------------------

            response.raise_for_status()


            data = response.json()


            if "daily" not in data:

                raise RuntimeError(
                    "API response does not contain daily data"
                )


            daily = data["daily"]


            if "time" not in daily:

                raise RuntimeError(
                    "API response contains no dates"
                )


            result = pd.DataFrame(daily)


            # ------------------------------------------------
            # ADD LOCATION
            # ------------------------------------------------

            result["latitude"] = latitude

            result["longitude"] = longitude


            # ------------------------------------------------
            # CONVERT DATE
            # ------------------------------------------------

            result["date"] = pd.to_datetime(
                result["time"]
            )

            result.drop(
                columns=["time"],
                inplace=True
            )


            # ------------------------------------------------
            # REORDER
            # ------------------------------------------------

            first_columns = [
                "date",
                "latitude",
                "longitude",
            ]

            remaining = [
                c
                for c in result.columns
                if c not in first_columns
            ]

            result = result[
                first_columns + remaining
            ]


            # ------------------------------------------------
            # SUCCESS
            # ------------------------------------------------

            time.sleep(
                MIN_DELAY +
                random.uniform(0.5, 1.5)
            )

            return result


        except requests.exceptions.RequestException as e:

            if attempt == MAX_RETRIES:

                raise RuntimeError(
                    f"Request failed after "
                    f"{MAX_RETRIES} attempts: {e}"
                )


            wait = min(
                10 * (2 ** (attempt - 1)),
                MAX_BACKOFF
            )

            wait += random.uniform(1, 5)

            print(
                f"      Request error: {e}"
            )

            print(
                f"      Waiting {wait:.1f}s "
                f"before retry..."
            )

            time.sleep(wait)


        except Exception:

            raise


    raise RuntimeError(
        "Unexpected download failure"
    )


# ============================================================
# DOWNLOAD ONE DISTRICT
# ============================================================

def download_district(row):

    state = str(row["State"])

    district = str(row["District"])

    latitude = float(row["latitude"])

    longitude = float(row["longitude"])


    first_date = pd.Timestamp(
        row["First_Flood_Date"]
    )

    last_date = pd.Timestamp(
        row["Last_Flood_Date"]
    )


    # --------------------------------------------------------
    # CLIP TO AVAILABLE ERA5 PERIOD
    # --------------------------------------------------------

    start_date = max(
        first_date,
        MIN_DATE
    )

    end_date = min(
        last_date,
        MAX_DATE
    )


    if start_date > end_date:

        raise ValueError(
            "No valid weather period"
        )


    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    filename = (
        safe_filename(
            state,
            district
        )
        + ".csv"
    )

    output_file = OUTPUT_DIR / filename


    # --------------------------------------------------------
    # RESUME
    # --------------------------------------------------------

    if output_file.exists():

        try:

            existing = pd.read_csv(
                output_file,
                usecols=["date"]
            )

            if len(existing) > 0:

                existing_dates = pd.to_datetime(
                    existing["date"],
                    errors="coerce"
                )

                existing_start = (
                    existing_dates.min()
                )

                existing_end = (
                    existing_dates.max()
                )


                # Existing file completely covers requirement
                if (
                    existing_start <= start_date
                    and
                    existing_end >= end_date
                ):

                    return (
                        "SKIPPED",
                        len(existing),
                        output_file
                    )

        except Exception:

            # If file is corrupted, redownload
            pass


    # --------------------------------------------------------
    # YEAR CHUNKS
    # --------------------------------------------------------

    chunks = []

    current_year = start_date.year

    while current_year <= end_date.year:

        chunk_start = pd.Timestamp(
            f"{current_year}-01-01"
        )

        chunk_end = pd.Timestamp(
            f"{current_year}-12-31"
        )


        chunk_start = max(
            chunk_start,
            start_date
        )

        chunk_end = min(
            chunk_end,
            end_date
        )


        chunks.append(
            (
                chunk_start,
                chunk_end
            )
        )

        current_year += 1


    print(
        f"\n  {state} | {district}"
    )

    print(
        f"    Coordinates: "
        f"{latitude:.5f}, "
        f"{longitude:.5f}"
    )

    print(
        f"    Period: "
        f"{start_date.date()} → "
        f"{end_date.date()}"
    )

    print(
        f"    Chunks: {len(chunks)}"
    )


    # --------------------------------------------------------
    # DOWNLOAD CHUNKS
    # --------------------------------------------------------

    for index, (
        chunk_start,
        chunk_end
    ) in enumerate(chunks, start=1):

        print(
            f"    [{index}/{len(chunks)}] "
            f"{chunk_start.year}"
        )


        data = download_year(
            latitude,
            longitude,
            chunk_start,
            chunk_end
        )


        chunks_data = data

        chunks.append if False else None


        # ----------------------------------------------------
        # STORE TEMPORARILY
        # ----------------------------------------------------

        if index == 1:

            all_data = chunks_data

        else:

            all_data = pd.concat(
                [
                    all_data,
                    chunks_data
                ],
                ignore_index=True
            )


    # --------------------------------------------------------
    # FINAL SORT
    # --------------------------------------------------------

    all_data = all_data.sort_values(
        "date"
    ).reset_index(
        drop=True
    )


    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    all_data = all_data.drop_duplicates(
        subset=["date"]
    )


    # --------------------------------------------------------
    # ADD DISTRICT INFORMATION
    # --------------------------------------------------------

    all_data.insert(
        0,
        "state",
        state
    )

    all_data.insert(
        1,
        "district",
        district
    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    all_data.to_csv(
        output_file,
        index=False
    )


    return (
        "SUCCESS",
        len(all_data),
        output_file
    )


# ============================================================
# PROGRESS MANAGEMENT
# ============================================================

if PROGRESS_FILE.exists():

    progress = pd.read_csv(
        PROGRESS_FILE
    )

else:

    progress = pd.DataFrame(
        columns=[
            "district_id",
            "state",
            "district",
            "status",
            "records",
            "timestamp",
            "file",
        ]
    )


completed_ids = set(
    progress.loc[
        progress["status"].isin(
            [
                "SUCCESS",
                "SKIPPED"
            ]
        ),
        "district_id"
    ].astype(str)
)


# ============================================================
# MAIN LOOP
# ============================================================

total = len(requirements)

success_count = 0
skip_count = 0
fail_count = 0


print("\n" + "=" * 70)
print("STARTING DOWNLOAD")
print("=" * 70)


for index, row in requirements.head(1).iterrows():

    state = str(row["State"])

    district = str(row["District"])

    did = district_id(
        state,
        district
    )


    # --------------------------------------------------------
    # ALREADY COMPLETED
    # --------------------------------------------------------

    if did in completed_ids:

        print(
            f"\n[{index + 1}/{total}] "
            f"{state} | {district} "
            f"→ already completed"
        )

        continue


    try:

        status, records, output_file = (
            download_district(row)
        )


        print(
            f"    → {status}: "
            f"{records:,} records"
        )


        new_row = pd.DataFrame(
            [
                {
                    "district_id": did,
                    "state": state,
                    "district": district,
                    "status": status,
                    "records": records,
                    "timestamp":
                        datetime.now().isoformat(),
                    "file":
                        str(output_file),
                }
            ]
        )


        progress = pd.concat(
            [
                progress,
                new_row
            ],
            ignore_index=True
        )


        progress.to_csv(
            PROGRESS_FILE,
            index=False
        )


        if status == "SUCCESS":

            success_count += 1

        else:

            skip_count += 1


    except Exception as e:

        print(
            f"    → FAILED: {e}"
        )


        fail_count += 1


        failure_row = pd.DataFrame(
            [
                {
                    "district_id": did,
                    "state": state,
                    "district": district,
                    "error": str(e),
                    "timestamp":
                        datetime.now().isoformat(),
                }
            ]
        )


        if FAILED_FILE.exists():

            failed = pd.read_csv(
                FAILED_FILE
            )

            failed = pd.concat(
                [
                    failed,
                    failure_row
                ],
                ignore_index=True
            )

        else:

            failed = failure_row


        failed.to_csv(
            FAILED_FILE,
            index=False
        )


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("DOWNLOAD SUMMARY")
print("=" * 70)

print(
    f"\nSuccessful: "
    f"{success_count:,}"
)

print(
    f"Skipped/already complete: "
    f"{skip_count:,}"
)

print(
    f"Failed this run: "
    f"{fail_count:,}"
)

print(
    f"\nOutput directory:"
    f"\n{OUTPUT_DIR}"
)

print(
    f"\nProgress file:"
    f"\n{PROGRESS_FILE}"
)

print("\nFinished.")
print("=" * 70)
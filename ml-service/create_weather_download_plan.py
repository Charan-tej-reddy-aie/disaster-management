import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

REQUIREMENTS_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_weather_requirements_final.csv"
)

WEATHER_DIR = os.path.join(
    BASE_DIR,
    "data",
    "historical_weather_india_batched"
)

PLAN_FILE = os.path.join(
    BASE_DIR,
    "data",
    "weather_download_remaining.csv"
)


# ============================================================
# LOAD REQUIREMENTS
# ============================================================

print("=" * 70)
print("CREATING REMAINING WEATHER DOWNLOAD PLAN")
print("=" * 70)

df = pd.read_csv(
    REQUIREMENTS_FILE
)

print(
    f"\nDistrict requirements: {len(df)}"
)


# ============================================================
# CREATE COORDINATE ID
# ============================================================

df["coordinate_id"] = (
    df["latitude"].round(5).astype(str)
    + "|"
    + df["longitude"].round(5).astype(str)
)


# ============================================================
# CREATE ALL REQUIRED JOBS
# ============================================================

jobs = []

for _, row in df.iterrows():

    first_year = int(
        row["First_Flood_Year"]
    )

    last_year = int(
        row["Last_Flood_Year"]
    )

    for year in range(
        first_year,
        last_year + 1
    ):

        jobs.append({

            "State":
                row["State"],

            "District":
                row["District"],

            "coordinate_id":
                row["coordinate_id"],

            "latitude":
                row["latitude"],

            "longitude":
                row["longitude"],

            "year":
                year

        })


required_jobs = pd.DataFrame(
    jobs
)


# ============================================================
# CHECK EXISTING FILES
# ============================================================

def get_filename(
    coordinate_id,
    year
):

    safe_id = (
        str(coordinate_id)
        .replace("|", "_")
        .replace(" ", "_")
    )

    return (
        f"{safe_id}_{year}.csv"
    )


required_jobs["filename"] = (
    required_jobs.apply(
        lambda row:
            get_filename(
                row["coordinate_id"],
                int(row["year"])
            ),
        axis=1
    )
)


required_jobs["filepath"] = (
    required_jobs["filename"]
    .apply(
        lambda filename:
            os.path.join(
                WEATHER_DIR,
                filename
            )
    )
)


required_jobs["exists"] = (
    required_jobs["filepath"]
    .apply(os.path.exists)
)


# ============================================================
# SPLIT EXISTING / MISSING
# ============================================================

existing = required_jobs[
    required_jobs["exists"]
].copy()

missing = required_jobs[
    ~required_jobs["exists"]
].copy()


# ============================================================
# SAVE MISSING PLAN
# ============================================================

missing.to_csv(
    PLAN_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("DOWNLOAD PLAN SUMMARY")
print("=" * 70)

print(
    f"\nTotal required jobs: "
    f"{len(required_jobs):,}"
)

print(
    f"Already downloaded: "
    f"{len(existing):,}"
)

print(
    f"Remaining jobs: "
    f"{len(missing):,}"
)

print(
    f"\nMissing plan saved to:"
)

print(
    PLAN_FILE
)


# ============================================================
# YEAR SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("MISSING JOBS BY YEAR")
print("=" * 70)

year_summary = (
    missing
    .groupby("year")
    .size()
    .reset_index(
        name="missing_jobs"
    )
)

print(
    year_summary.to_string(
        index=False
    )
)


# ============================================================
# STATE SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("MISSING JOBS BY STATE")
print("=" * 70)

state_summary = (
    missing
    .groupby("State")
    .size()
    .sort_values(
        ascending=False
    )
)

print(
    state_summary.head(20).to_string()
)


# ============================================================
# COORDINATE SUMMARY
# ============================================================

unique_missing_coordinates = (
    missing["coordinate_id"]
    .nunique()
)

print(
    f"\nUnique coordinates still requiring data: "
    f"{unique_missing_coordinates}"
)


print("\nDone.")
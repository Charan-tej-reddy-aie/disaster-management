import pandas as pd
import requests
from io import StringIO
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# SOURCE 1: District coordinates
# ---------------------------------------------------------

COORDINATE_URL = (
    "https://gist.githubusercontent.com/"
    "meghamodi/6a49554f26b3d5b7097a9f08841e4241/"
    "raw/Districtwise_India.csv"
)

print("=" * 70)
print("CREATING INDIA DISTRICT MASTER")
print("=" * 70)

print("\nDownloading district coordinate dataset...")

response = requests.get(COORDINATE_URL, timeout=60)
response.raise_for_status()

coord_df = pd.read_csv(
    StringIO(response.text),
    sep="\t"
)

print("Coordinate dataset rows:", len(coord_df))
print("Columns:", list(coord_df.columns))


# ---------------------------------------------------------
# Keep required columns
# ---------------------------------------------------------

required_columns = [
    "State",
    "District",
    "Lat",
    "Long"
]

missing = [
    col for col in required_columns
    if col not in coord_df.columns
]

if missing:
    raise ValueError(
        f"Required columns missing from coordinate dataset: {missing}"
    )

master = coord_df[required_columns].copy()

master = master.rename(
    columns={
        "State": "state_name",
        "District": "district_name",
        "Lat": "latitude",
        "Long": "longitude"
    }
)


# ---------------------------------------------------------
# Basic cleaning
# ---------------------------------------------------------

def clean_text(value):
    if pd.isna(value):
        return ""

    value = str(value).strip()

    value = re.sub(r"\s+", " ", value)

    return value


master["state_name"] = master["state_name"].apply(clean_text)
master["district_name"] = master["district_name"].apply(clean_text)

master["latitude"] = pd.to_numeric(
    master["latitude"],
    errors="coerce"
)

master["longitude"] = pd.to_numeric(
    master["longitude"],
    errors="coerce"
)


# ---------------------------------------------------------
# Remove invalid administrative entries
# ---------------------------------------------------------

invalid_districts = {
    "",
    "Unassigned",
    "Other State",
    "Foreign Evacuees",
    "Airport Quarantine"
}

master = master[
    ~master["district_name"].isin(invalid_districts)
].copy()


# ---------------------------------------------------------
# Remove rows without coordinates
# ---------------------------------------------------------

before_coordinates = len(master)

master = master.dropna(
    subset=["latitude", "longitude"]
).copy()

print(
    "Removed rows without coordinates:",
    before_coordinates - len(master)
)


# ---------------------------------------------------------
# Normalize names for matching
# ---------------------------------------------------------

def normalize_name(value):
    value = str(value).lower().strip()

    value = value.replace("&", "and")

    value = re.sub(
        r"[^a-z0-9\s]",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


master["state_normalized"] = (
    master["state_name"]
    .apply(normalize_name)
)

master["district_normalized"] = (
    master["district_name"]
    .apply(normalize_name)
)


# ---------------------------------------------------------
# Remove duplicate district/state combinations
# ---------------------------------------------------------

master = master.drop_duplicates(
    subset=[
        "state_normalized",
        "district_normalized"
    ]
).copy()


# ---------------------------------------------------------
# Create district ID
# ---------------------------------------------------------

master.insert(
    0,
    "district_master_id",
    range(1, len(master) + 1)
)


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

output_file = (
    DATA_DIR /
    "india_district_master.csv"
)

master.to_csv(
    output_file,
    index=False
)

print("\n" + "=" * 70)
print("DISTRICT MASTER CREATED")
print("=" * 70)

print("Rows:", len(master))
print(
    "Unique states:",
    master["state_name"].nunique()
)

print(
    "Unique districts:",
    master["district_name"].nunique()
)

print("\nSample:")
print(
    master[
        [
            "district_master_id",
            "state_name",
            "district_name",
            "latitude",
            "longitude"
        ]
    ].head(20).to_string(index=False)
)

print("\nSaved to:")
print(output_file)

print("\nDONE")
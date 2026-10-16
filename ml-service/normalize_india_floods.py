import pandas as pd
import re
from pathlib import Path

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path(
    "data/india_flood_inventory/India_Flood_Inventory_v3.csv"
)

OUTPUT_FILE = Path(
    "data/india_flood_event_districts.csv"
)

# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("Loading India Flood Inventory")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print(f"Original rows: {len(df)}")
print(f"Original columns: {len(df.columns)}")

print("\nColumns:")
for column in df.columns:
    print(f" - {column}")

# ============================================================
# SELECT REQUIRED COLUMNS
# ============================================================

required_columns = [
    "UEI",
    "Start Date",
    "End Date",
    "Duration(Days)",
    "Main Cause",
    "Districts",
    "State",
    "State_Codes"
]

missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )

df = df[required_columns].copy()

# ============================================================
# CLEAN DATES
# ============================================================

print("\n" + "=" * 60)
print("Cleaning dates")
print("=" * 60)

df["Start Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)

df["End Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

# Remove records where dates are unavailable
before = len(df)

df = df.dropna(
    subset=["Start Date", "End Date"]
)

print(
    f"Removed rows with invalid dates: "
    f"{before - len(df)}"
)

# ============================================================
# CLEAN DISTRICT FIELD
# ============================================================

print("\n" + "=" * 60)
print("Cleaning district names")
print("=" * 60)


def clean_text(value):
    if pd.isna(value):
        return ""

    value = str(value)

    # Normalize separators
    value = value.replace(";", ",")
    value = value.replace("|", ",")
    value = value.replace("/", ",")

    # Normalize multiple spaces
    value = re.sub(r"\s+", " ", value)

    return value.strip()


df["Districts"] = df["Districts"].apply(clean_text)

# ============================================================
# SPLIT MULTIPLE DISTRICTS
# ============================================================

print("Splitting multi-district events...")

df["District"] = df["Districts"].str.split(",")

df = df.explode("District")

# Clean individual district names
df["District"] = (
    df["District"]
    .astype(str)
    .str.strip()
)

# Remove empty values
df = df[
    (df["District"] != "") &
    (df["District"].str.lower() != "nan")
]

# ============================================================
# BASIC CLEANING
# ============================================================

# Remove leading/trailing punctuation
df["District"] = (
    df["District"]
    .str.replace(r"^[\s\-:]+", "", regex=True)
    .str.replace(r"[\s\-:]+$", "", regex=True)
    .str.strip()
)

df["State"] = (
    df["State"]
    .astype(str)
    .str.strip()
)

# ============================================================
# REMOVE DUPLICATES
# ============================================================

before = len(df)

df = df.drop_duplicates(
    subset=["UEI", "District"]
)

print(
    f"Duplicate event-district rows removed: "
    f"{before - len(df)}"
)

# ============================================================
# ADD FLOOD TARGET
# ============================================================

df["Flood_Occurred"] = 1

# ============================================================
# SELECT FINAL COLUMNS
# ============================================================

df = df[
    [
        "UEI",
        "Start Date",
        "End Date",
        "Duration(Days)",
        "Main Cause",
        "District",
        "State",
        "State_Codes",
        "Flood_Occurred"
    ]
]

# ============================================================
# SORT
# ============================================================

df = df.sort_values(
    by=["State", "District", "Start Date"]
).reset_index(drop=True)

# ============================================================
# SAVE
# ============================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("INDIA FLOOD EVENT-DISTRICT DATASET CREATED")
print("=" * 60)

print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")

print(
    f"States represented: "
    f"{df['State'].nunique()}"
)

print(
    f"District names represented: "
    f"{df['District'].nunique()}"
)

print(
    f"Date range: "
    f"{df['Start Date'].min().date()} "
    f"to "
    f"{df['End Date'].max().date()}"
)

print("\nFlood events by state:")

state_counts = (
    df.groupby("State")["UEI"]
    .nunique()
    .sort_values(ascending=False)
)

print(state_counts.to_string())

print("\nTop 20 districts by number of flood events:")

district_counts = (
    df.groupby("District")["UEI"]
    .nunique()
    .sort_values(ascending=False)
    .head(20)
)

print(district_counts.to_string())

print("\nSaved to:")
print(OUTPUT_FILE)
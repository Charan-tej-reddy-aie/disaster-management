import pandas as pd
from pathlib import Path

INPUT_FILE = Path(
    "data/india_flood_inventory/India_Flood_Inventory_v3.csv"
)

df = pd.read_csv(INPUT_FILE)

# Convert dates
df["Start_Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)

df["End_Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

# Records where either date is missing
missing = df[
    df["Start_Date"].isna() |
    df["End_Date"].isna()
].copy()

print("=" * 80)
print("MISSING DATE RECORD INSPECTION")
print("=" * 80)

print(f"\nTotal records: {len(df)}")
print(f"Records with missing date: {len(missing)}")

print("\nColumns containing date/time in their name:")

for column in df.columns:
    if "date" in column.lower() or "time" in column.lower():
        print(" -", column)

print("\n" + "=" * 80)
print("RAW DATE VALUES")
print("=" * 80)

print("\nMost common Start Date values among missing-date records:")

print(
    missing["Start Date"]
    .astype(str)
    .value_counts()
    .head(50)
    .to_string()
)

print("\nMost common End Date values among missing-date records:")

print(
    missing["End Date"]
    .astype(str)
    .value_counts()
    .head(50)
    .to_string()
)

# ============================================================
# CHECK OTHER INFORMATION
# ============================================================

print("\n" + "=" * 80)
print("SAMPLE MISSING-DATE RECORDS")
print("=" * 80)

columns_to_show = [
    "UEI",
    "Start Date",
    "End Date",
    "Duration(Days)",
    "Main Cause",
    "Location",
    "Districts",
    "State",
    "Event Source",
    "Event Souce ID"
]

available_columns = [
    c for c in columns_to_show
    if c in missing.columns
]

print(
    missing[
        available_columns
    ]
    .head(100)
    .to_string(index=False)
)

# ============================================================
# MISSING DATES BY STATE
# ============================================================

print("\n" + "=" * 80)
print("MISSING DATES BY STATE")
print("=" * 80)

state_missing = (
    missing["State"]
    .fillna("MISSING")
    .astype(str)
    .str.strip()
    .value_counts()
)

print(state_missing.to_string())

# ============================================================
# DURATION INFORMATION
# ============================================================

print("\n" + "=" * 80)
print("DURATION INFORMATION")
print("=" * 80)

duration = pd.to_numeric(
    missing["Duration(Days)"],
    errors="coerce"
)

print(
    f"Missing-date records with duration: "
    f"{duration.notna().sum()}"
)

print(
    f"Missing-date records without duration: "
    f"{duration.isna().sum()}"
)

print("\nDuration statistics:")

print(
    duration.describe()
)

# ============================================================
# SAVE SAMPLE
# ============================================================

output_file = Path(
    "data/missing_date_records_sample.csv"
)

missing[
    available_columns
].head(500).to_csv(
    output_file,
    index=False
)

print("\nSaved sample to:")
print(output_file)

print("\n" + "=" * 80)
print("INSPECTION COMPLETE")
print("=" * 80)
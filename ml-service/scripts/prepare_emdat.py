from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]

INPUT_FILE = BASE_DIR / "data" / "disasters" / "emdat.xlsx"
OUTPUT_DIR = BASE_DIR / "data" / "disasters"

OUTPUT_FILE = OUTPUT_DIR / "emdat_events_clean.csv"
SUMMARY_FILE = OUTPUT_DIR / "emdat_event_summary.csv"


# ============================================================
# CONFIGURATION
# ============================================================

DISASTER_TYPE_MAP = {
    "Flood": "FLOOD",
    "Storm": "CYCLONE",
    "Extreme temperature": "HEATWAVE",
    "Drought": "DROUGHT",
    "Landslide": "LANDSLIDE",
    "Wildfire": "WILDFIRE",
    "Earthquake": "EARTHQUAKE",
    "Tsunami": "TSUNAMI",
    "Volcanic activity": "VOLCANIC",
    "Epidemic": "EPIDEMIC",
    "Insect infestation": "INSECT_INFESTATION",
    "Mass movement (dry)": "MASS_MOVEMENT",
}


# ============================================================
# LOAD
# ============================================================

print("=" * 70)
print("EM-DAT CLEANING")
print("=" * 70)

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"EM-DAT file not found:\n{INPUT_FILE}"
    )

df = pd.read_excel(INPUT_FILE)

print(f"\nInput rows: {len(df):,}")


# ============================================================
# BASIC CLEANING
# ============================================================

df.columns = df.columns.str.strip()

# Keep India only as a safety check
df = df[df["ISO"].astype(str).str.upper() == "IND"].copy()

print(f"India rows: {len(df):,}")


# ============================================================
# CREATE START / END DATES
# ============================================================

def make_date(year, month, day):
    """
    Create a date while handling missing EM-DAT day values.

    If day is missing, use the first day of the month.
    """

    if pd.isna(year):
        return pd.NaT

    year = int(year)

    if pd.isna(month):
        month = 1
    else:
        month = int(month)

    if pd.isna(day):
        day = 1
    else:
        day = int(day)

    try:
        return pd.Timestamp(year=year, month=month, day=day)
    except Exception:
        return pd.NaT


df["start_date"] = df.apply(
    lambda row: make_date(
        row["Start Year"],
        row["Start Month"],
        row["Start Day"]
    ),
    axis=1
)

df["end_date"] = df.apply(
    lambda row: make_date(
        row["End Year"],
        row["End Month"],
        row["End Day"]
    ),
    axis=1
)


# ============================================================
# NORMALIZE DISASTER TYPE
# ============================================================

df["disaster_type_raw"] = (
    df["Disaster Type"]
    .astype(str)
    .str.strip()
)

df["disaster_label"] = (
    df["disaster_type_raw"]
    .map(DISASTER_TYPE_MAP)
)

# Keep original type when no mapping exists
df["disaster_label"] = df["disaster_label"].fillna(
    df["disaster_type_raw"]
    .str.upper()
    .str.replace(" ", "_")
)


# ============================================================
# COORDINATE INFORMATION
# ============================================================

df["has_coordinates"] = (
    df["Latitude"].notna() &
    df["Longitude"].notna()
)

print(
    f"\nEvents with coordinates: "
    f"{df['has_coordinates'].sum():,}"
)

print(
    f"Events without coordinates: "
    f"{(~df['has_coordinates']).sum():,}"
)


# ============================================================
# LOCATION INFORMATION
# ============================================================

df["location"] = (
    df["Location"]
    .fillna("")
    .astype(str)
    .str.strip()
)

df["admin_units"] = (
    df["Admin Units"]
    .fillna("")
    .astype(str)
    .str.strip()
)

df["gadm_admin_units"] = (
    df["GADM Admin Units"]
    .fillna("")
    .astype(str)
    .str.strip()
)


# ============================================================
# IMPORTANT EVENT INFORMATION
# ============================================================

clean_columns = [
    "DisNo.",
    "Event Name",

    "disaster_type_raw",
    "Disaster Subtype",
    "disaster_label",

    "start_date",
    "end_date",

    "Latitude",
    "Longitude",
    "has_coordinates",

    "location",
    "admin_units",
    "gadm_admin_units",

    "Total Deaths",
    "No. Affected",
    "Total Affected",

    "Magnitude",
    "Magnitude Scale",

    "Associated Types",
    "Origin",

    "Entry Date",
    "Last Update"
]

clean_df = df[clean_columns].copy()


# ============================================================
# SORT
# ============================================================

clean_df = clean_df.sort_values(
    ["start_date", "disaster_label"]
).reset_index(drop=True)


# ============================================================
# SAVE CLEAN DATA
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

clean_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# EVENT TYPE SUMMARY
# ============================================================

summary = (
    clean_df
    .groupby("disaster_label")
    .agg(
        event_count=("DisNo.", "count"),
        events_with_coordinates=("has_coordinates", "sum"),
        events_without_coordinates=(
            "has_coordinates",
            lambda x: (~x).sum()
        ),
        total_affected=("Total Affected", "sum"),
        total_deaths=("Total Deaths", "sum")
    )
    .reset_index()
    .sort_values("event_count", ascending=False)
)

summary.to_csv(
    SUMMARY_FILE,
    index=False
)


# ============================================================
# PRINT RESULTS
# ============================================================

print("\n" + "=" * 70)
print("DISASTER TYPE SUMMARY")
print("=" * 70)

print(summary.to_string(index=False))


print("\n" + "=" * 70)
print("DATE RANGE")
print("=" * 70)

print(
    f"Start: {clean_df['start_date'].min()}"
)

print(
    f"End  : {clean_df['end_date'].max()}"
)


print("\n" + "=" * 70)
print("OUTPUT")
print("=" * 70)

print(f"\nClean events:")
print(OUTPUT_FILE)

print(f"\nSummary:")
print(SUMMARY_FILE)

print("\n" + "=" * 70)
print("EM-DAT CLEANING COMPLETE")
print("=" * 70)
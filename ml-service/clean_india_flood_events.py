import pandas as pd
from pathlib import Path
import re

# ============================================================
# CONFIG
# ============================================================

INPUT_FILE = Path(
    "data/india_flood_inventory/India_Flood_Inventory_v3.csv"
)

OUTPUT_FILE = Path(
    "data/india_flood_event_districts_clean.csv"
)

REVIEW_FILE = Path(
    "data/india_flood_unresolved_locations.csv"
)

# ============================================================
# LOAD
# ============================================================

print("=" * 70)
print("CLEANING INDIA FLOOD EVENT DATA")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

print(f"Original records: {len(df)}")

# ============================================================
# DATE PARSING
# ============================================================

df["Start Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)

df["End Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

# Only records with both dates
df = df[
    df["Start Date"].notna() &
    df["End Date"].notna()
].copy()

print(
    f"Records with valid dates: {len(df)}"
)

# ============================================================
# BASIC TEXT CLEANING
# ============================================================

def clean_text(value):

    if pd.isna(value):
        return ""

    value = str(value)

    value = value.replace("\n", " ")
    value = value.replace(";", ",")
    value = value.replace("|", ",")
    value = value.replace("/", ",")

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


df["Districts"] = (
    df["Districts"]
    .apply(clean_text)
)

df["State"] = (
    df["State"]
    .apply(clean_text)
)

# ============================================================
# SPLIT DISTRICTS
# ============================================================

df["District"] = (
    df["Districts"]
    .str.split(",")
)

df = df.explode(
    "District"
)

df["District"] = (
    df["District"]
    .astype(str)
    .str.strip()
)

# ============================================================
# CLEAN DISTRICT NAMES
# ============================================================

df["District"] = (
    df["District"]
    .str.replace(
        r"^[\s\-:&]+",
        "",
        regex=True
    )
    .str.replace(
        r"[\s\-:&]+$",
        "",
        regex=True
    )
    .str.strip()
)

# ============================================================
# REMOVE EMPTY
# ============================================================

df = df[
    (df["District"] != "") &
    (df["District"].str.lower() != "nan")
]

# ============================================================
# KNOWN NON-DISTRICT DESCRIPTIONS
# ============================================================

invalid_patterns = [
    r"^southern parts$",
    r"^northern parts$",
    r"^many parts$",
    r"^some parts$",
    r"^most parts$",
    r"^few districts$",
    r"^many districts",
    r"^parts of ",
    r"^different parts",
    r"^districts of ",
    r"^coastal districts",
    r"^hilly areas$",
    r"^ghat area$",
    r"^greater kolkata area$",
    r"^many parts of",
    r"^various parts"
]

invalid_regex = re.compile(
    "|".join(invalid_patterns),
    flags=re.IGNORECASE
)

df["is_unresolved"] = (
    df["District"]
    .apply(
        lambda x: bool(
            invalid_regex.search(x.strip())
        )
    )
)

# ============================================================
# SAVE UNRESOLVED RECORDS
# ============================================================

unresolved = df[
    df["is_unresolved"]
].copy()

unresolved.to_csv(
    REVIEW_FILE,
    index=False
)

print(
    f"Unresolved descriptive locations: "
    f"{len(unresolved)}"
)

# ============================================================
# KEEP VALID DISTRICTS
# ============================================================

df = df[
    ~df["is_unresolved"]
].copy()

# ============================================================
# REMOVE DUPLICATES
# ============================================================

before = len(df)

df = df.drop_duplicates(
    subset=[
        "UEI",
        "District"
    ]
)

print(
    f"Duplicate event-district rows removed: "
    f"{before - len(df)}"
)

# ============================================================
# FINAL COLUMNS
# ============================================================

df["Flood_Occurred"] = 1

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
    by=[
        "State",
        "District",
        "Start Date"
    ]
).reset_index(
    drop=True
)

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

print("\n" + "=" * 70)
print("CLEAN DATASET CREATED")
print("=" * 70)

print(
    f"Rows: {len(df)}"
)

print(
    f"Unique districts: "
    f"{df['District'].nunique()}"
)

print(
    f"Unique state strings: "
    f"{df['State'].nunique()}"
)

print(
    f"Date range: "
    f"{df['Start Date'].min().date()} "
    f"to "
    f"{df['End Date'].max().date()}"
)

print("\nTop states:")

print(
    df["State"]
    .value_counts()
    .head(30)
    .to_string()
)

print("\nTop districts:")

print(
    df["District"]
    .value_counts()
    .head(30)
    .to_string()
)

print("\nSaved clean data to:")
print(OUTPUT_FILE)

print("\nSaved unresolved locations to:")
print(REVIEW_FILE)

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)
from pathlib import Path
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = (
    BASE_DIR
    / "data"
    / "india_flood_event_districts_clean.csv"
)

OUTPUT_FILE = (
    BASE_DIR
    / "data"
    / "india_weather_requirements.csv"
)


# ============================================================
# SETTINGS
# ============================================================

MIN_YEAR = 1971
MAX_YEAR = 2023


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("ANALYZING WEATHER REQUIREMENTS")
print("=" * 70)


# ============================================================
# CHECK INPUT FILE
# ============================================================

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"\nFlood dataset not found:\n{INPUT_FILE}\n"
    )


# ============================================================
# LOAD FLOOD DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)

print(f"\nFlood records loaded: {len(df):,}")

print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "UEI",
    "Start Date",
    "End Date",
    "District",
    "State",
]

missing_columns = [
    column
    for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"\nMissing required columns: {missing_columns}\n"
    )


# ============================================================
# CLEAN COLUMN VALUES
# ============================================================

df["District"] = (
    df["District"]
    .astype(str)
    .str.strip()
)

df["State"] = (
    df["State"]
    .astype(str)
    .str.strip()
)


# ============================================================
# PARSE DATES
# ============================================================

df["Start Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce",
    dayfirst=False
)

df["End Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce",
    dayfirst=False
)


# ============================================================
# DATE STATISTICS
# ============================================================

both_dates = df[
    df["Start Date"].notna()
    & df["End Date"].notna()
].copy()

print(
    f"\nRecords with both dates: {len(both_dates):,}"
)

print(
    f"Records with missing start date: "
    f"{df['Start Date'].isna().sum():,}"
)

print(
    f"Records with missing end date: "
    f"{df['End Date'].isna().sum():,}"
)


# ============================================================
# REMOVE INVALID DATES
# ============================================================

usable = both_dates.copy()


# ============================================================
# REMOVE INVALID DISTRICT NAMES
# ============================================================

invalid_districts = [
    "",
    "nan",
    "unknown",
    "others",
    "bsf camp",
    "railway quarantine",
]

usable = usable[
    ~usable["District"]
    .str.lower()
    .isin(invalid_districts)
].copy()


# ============================================================
# REMOVE DESCRIPTIVE / NON-DISTRICT LOCATIONS
# ============================================================

descriptive_patterns = [
    "many parts",
    "southern parts",
    "northern parts",
    "different parts",
    "parts of",
    "most parts",
    "some parts",
    "few districts",
    "many districts",
    "districts affected",
    "out of",
    "greater kolkata area",
    "ghat area",
    "hilly areas",
]

pattern = "|".join(
    [p.replace(" ", r"\s+") for p in descriptive_patterns]
)

descriptive_mask = (
    usable["District"]
    .str.lower()
    .str.contains(pattern, regex=True, na=False)
)

descriptive_count = descriptive_mask.sum()

usable = usable[
    ~descriptive_mask
].copy()

print(
    f"Descriptive/non-district records removed: "
    f"{descriptive_count:,}"
)


# ============================================================
# LIMIT TO WEATHER DATA PERIOD
# ============================================================

usable = usable[
    (
        usable["Start Date"].dt.year <= MAX_YEAR
    )
    &
    (
        usable["End Date"].dt.year >= MIN_YEAR
    )
].copy()

print(
    f"Records overlapping {MIN_YEAR}-{MAX_YEAR}: "
    f"{len(usable):,}"
)


# ============================================================
# CLIP DATES TO WEATHER PERIOD
# ============================================================

min_date = pd.Timestamp(
    f"{MIN_YEAR}-01-01"
)

max_date = pd.Timestamp(
    f"{MAX_YEAR}-12-31"
)

usable["Weather Start"] = usable["Start Date"].clip(
    lower=min_date,
    upper=max_date
)

usable["Weather End"] = usable["End Date"].clip(
    lower=min_date,
    upper=max_date
)


# ============================================================
# REMOVE ANY INVALID DATE RANGES
# ============================================================

usable = usable[
    usable["Weather Start"]
    <= usable["Weather End"]
].copy()


# ============================================================
# CREATE YEAR RANGE
# ============================================================

usable["Start Year"] = (
    usable["Weather Start"]
    .dt.year
)

usable["End Year"] = (
    usable["Weather End"]
    .dt.year
)


# ============================================================
# CREATE WEATHER REQUIREMENT TABLE
# ============================================================

requirements = (
    usable
    .groupby(
        ["State", "District"],
        as_index=False
    )
    .agg(
        Flood_Records=("UEI", "count"),
        First_Flood_Date=(
            "Weather Start",
            "min"
        ),
        Last_Flood_Date=(
            "Weather End",
            "max"
        ),
        First_Flood_Year=(
            "Start Year",
            "min"
        ),
        Last_Flood_Year=(
            "End Year",
            "max"
        ),
    )
)


# ============================================================
# CALCULATE YEARS NEEDED
# ============================================================

requirements["Years_Needed"] = (
    requirements["Last_Flood_Year"]
    - requirements["First_Flood_Year"]
    + 1
)


# ============================================================
# SORT
# ============================================================

requirements = requirements.sort_values(
    [
        "State",
        "District"
    ]
).reset_index(drop=True)


# ============================================================
# SAVE
# ============================================================

requirements.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("WEATHER REQUIREMENT SUMMARY")
print("=" * 70)

print(
    f"\nUsable flood records: "
    f"{len(usable):,}"
)

print(
    f"Unique state-district combinations: "
    f"{len(requirements):,}"
)

print(
    f"First flood date: "
    f"{requirements['First_Flood_Date'].min().date()}"
)

print(
    f"Last flood date: "
    f"{requirements['Last_Flood_Date'].max().date()}"
)

print(
    f"Minimum flood year: "
    f"{requirements['First_Flood_Year'].min()}"
)

print(
    f"Maximum flood year: "
    f"{requirements['Last_Flood_Year'].max()}"
)

print(
    f"\nTotal weather district requirements: "
    f"{len(requirements):,}"
)


# ============================================================
# YEAR COVERAGE
# ============================================================

year_coverage = (
    usable
    .groupby("Start Year")
    .size()
    .sort_index()
)

print("\nFlood records by start year:")

print(year_coverage.to_string())


# ============================================================
# TOP DISTRICTS
# ============================================================

print("\nTop 20 districts by flood record count:")

top_districts = (
    requirements
    .sort_values(
        "Flood_Records",
        ascending=False
    )
    .head(20)
)

print(
    top_districts[
        [
            "State",
            "District",
            "Flood_Records",
            "First_Flood_Year",
            "Last_Flood_Year",
            "Years_Needed",
        ]
    ].to_string(index=False)
)


# ============================================================
# FINAL MESSAGE
# ============================================================

print("\n" + "=" * 70)
print("OUTPUT FILE")
print("=" * 70)

print(
    f"\nSaved weather requirements to:"
    f"\n{OUTPUT_FILE}"
)

print("\nAnalysis completed successfully.")
print("=" * 70)
import pandas as pd
from pathlib import Path
import re

INPUT_FILE = Path(
    "data/india_flood_inventory/India_Flood_Inventory_v3.csv"
)

OUTPUT_FILE = Path(
    "data/india_district_review.csv"
)

print("=" * 70)
print("INDIA DISTRICT / STATE ANALYSIS")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

# ------------------------------------------------------------
# Parse dates
# ------------------------------------------------------------

df["Start_Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)

df["End_Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

# Only records usable for time-based ML
df = df[
    df["Start_Date"].notna() &
    df["End_Date"].notna()
].copy()

print(f"\nRecords with valid dates: {len(df)}")

# ------------------------------------------------------------
# Clean district text
# ------------------------------------------------------------

def clean_text(value):

    if pd.isna(value):
        return ""

    value = str(value)

    value = value.replace(";", ",")
    value = value.replace("|", ",")
    value = value.replace("/", ",")

    value = re.sub(r"\s+", " ", value)

    return value.strip()


df["Districts"] = df["Districts"].apply(clean_text)

# ------------------------------------------------------------
# Split districts
# ------------------------------------------------------------

df["District"] = df["Districts"].str.split(",")

df = df.explode("District")

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

# ------------------------------------------------------------
# Clean district spelling
# ------------------------------------------------------------

df["District"] = (
    df["District"]
    .str.replace(r"^[\s\-:]+", "", regex=True)
    .str.replace(r"[\s\-:]+$", "", regex=True)
    .str.strip()
)

df["State"] = (
    df["State"]
    .fillna("")
    .astype(str)
    .str.strip()
)

# ------------------------------------------------------------
# Remove exact event-district duplicates
# ------------------------------------------------------------

df = df.drop_duplicates(
    subset=["UEI", "District"]
)

# ------------------------------------------------------------
# Create district-state combinations
# ------------------------------------------------------------

review = (
    df.groupby("District")
    .agg(
        event_count=("UEI", "nunique"),
        states=("State", lambda x: " | ".join(
            sorted(set(
                s.strip()
                for value in x
                for s in value.split(",")
                if s.strip()
            ))
        )),
        first_year=("Start_Date", lambda x: x.dt.year.min()),
        last_year=("Start_Date", lambda x: x.dt.year.max())
    )
    .reset_index()
)

# ------------------------------------------------------------
# Flag suspicious district names
# ------------------------------------------------------------

suspicious_patterns = [
    "parts",
    "many",
    "some",
    "most",
    "few",
    "districts",
    "area",
    "areas",
    "region",
    "regions",
    "state",
    "ghat",
    "coastal",
    "hilly",
    "various"
]

def is_suspicious(name):

    name_lower = name.lower()

    return any(
        pattern in name_lower
        for pattern in suspicious_patterns
    )


review["suspicious_name"] = (
    review["District"]
    .apply(is_suspicious)
)

# ------------------------------------------------------------
# Save
# ------------------------------------------------------------

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

review = review.sort_values(
    by="event_count",
    ascending=False
)

review.to_csv(
    OUTPUT_FILE,
    index=False
)

# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("RESULT")
print("=" * 70)

print(
    f"Unique district values: "
    f"{len(review)}"
)

print(
    f"Potentially suspicious district values: "
    f"{review['suspicious_name'].sum()}"
)

print("\nTop districts:")

print(
    review.head(30).to_string(index=False)
)

print("\nPotentially suspicious values:")

print(
    review[
        review["suspicious_name"]
    ]
    .head(100)
    .to_string(index=False)
)

print("\nSaved to:")
print(OUTPUT_FILE)

print("\n" + "=" * 70)
print("ANALYSIS COMPLETE")
print("=" * 70)
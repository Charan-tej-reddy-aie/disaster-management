import pandas as pd
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

FLOOD_FILE = DATA_DIR / "india_flood_event_districts_clean.csv"
MASTER_FILE = DATA_DIR / "india_district_master.csv"

OUTPUT_FILE = DATA_DIR / "india_flood_district_mapping.csv"
UNMATCHED_FILE = DATA_DIR / "india_flood_unmatched_districts.csv"


print("=" * 70)
print("MAPPING INDIA FLOOD DISTRICTS TO DISTRICT MASTER")
print("=" * 70)


# ---------------------------------------------------------
# Load datasets
# ---------------------------------------------------------

flood_df = pd.read_csv(FLOOD_FILE)
master_df = pd.read_csv(MASTER_FILE)

print("\nFlood dataset rows:", len(flood_df))
print("District master rows:", len(master_df))


# ---------------------------------------------------------
# Normalize names
# ---------------------------------------------------------

def normalize_name(value):
    if pd.isna(value):
        return ""

    value = str(value).lower().strip()

    value = value.replace("&", "and")

    # Remove punctuation
    value = re.sub(r"[^a-z0-9\s]", " ", value)

    # Normalize spaces
    value = re.sub(r"\s+", " ", value)

    return value.strip()


flood_df["district_normalized"] = (
    flood_df["District"]
    .apply(normalize_name)
)

flood_df["state_normalized"] = (
    flood_df["State"]
    .apply(normalize_name)
)

master_df["district_normalized"] = (
    master_df["district_name"]
    .apply(normalize_name)
)

master_df["state_normalized"] = (
    master_df["state_name"]
    .apply(normalize_name)
)


# ---------------------------------------------------------
# First: exact State + District match
# ---------------------------------------------------------

master_lookup = master_df[
    [
        "district_master_id",
        "state_name",
        "district_name",
        "latitude",
        "longitude",
        "state_normalized",
        "district_normalized"
    ]
].copy()


merged = flood_df.merge(
    master_lookup,
    on=[
        "state_normalized",
        "district_normalized"
    ],
    how="left",
    suffixes=("_flood", "_master")
)


# ---------------------------------------------------------
# Determine match status
# ---------------------------------------------------------

merged["match_status"] = "UNMATCHED"

merged.loc[
    merged["district_master_id"].notna(),
    "match_status"
] = "MATCHED"


# ---------------------------------------------------------
# Handle state strings containing multiple states
# ---------------------------------------------------------

def contains_multiple_states(value):
    if pd.isna(value):
        return False

    return "," in str(value)


merged.loc[
    (
        merged["match_status"] == "UNMATCHED"
    )
    &
    merged["State"].apply(contains_multiple_states),
    "match_status"
] = "MULTI_STATE_UNRESOLVED"


# ---------------------------------------------------------
# Save full mapping
# ---------------------------------------------------------

merged.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Create unmatched district report
# ---------------------------------------------------------

unmatched = merged[
    merged["match_status"] != "MATCHED"
].copy()


unmatched_summary = (
    unmatched[
        [
            "District",
            "State",
            "match_status"
        ]
    ]
    .drop_duplicates()
    .sort_values(
        ["State", "District"]
    )
)


unmatched_summary.to_csv(
    UNMATCHED_FILE,
    index=False
)


# ---------------------------------------------------------
# Statistics
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("MAPPING RESULTS")
print("=" * 70)

print(
    "\nTotal flood event-district rows:",
    len(merged)
)

print(
    "Matched rows:",
    (merged["match_status"] == "MATCHED").sum()
)

print(
    "Unmatched rows:",
    (merged["match_status"] == "UNMATCHED").sum()
)

print(
    "Multi-state unresolved rows:",
    (merged["match_status"] == "MULTI_STATE_UNRESOLVED").sum()
)


print(
    "\nMatched percentage:",
    round(
        100 *
        (
            merged["match_status"] == "MATCHED"
        ).mean(),
        2
    ),
    "%"
)


# ---------------------------------------------------------
# District-level unmatched statistics
# ---------------------------------------------------------

print(
    "\nUnique unmatched district/state combinations:",
    len(unmatched_summary)
)


print("\nTop unmatched combinations:")

print(
    unmatched_summary.head(50).to_string(
        index=False
    )
)


# ---------------------------------------------------------
# Save summary
# ---------------------------------------------------------

print("\nSaved full mapping to:")
print(OUTPUT_FILE)

print("\nSaved unmatched report to:")
print(UNMATCHED_FILE)

print("\n" + "=" * 70)
print("DONE")
print("=" * 70)
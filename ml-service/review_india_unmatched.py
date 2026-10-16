import pandas as pd
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

INPUT_FILE = DATA_DIR / "india_flood_unmatched_districts.csv"
OUTPUT_FILE = DATA_DIR / "india_flood_unmatched_review.csv"


print("=" * 70)
print("REVIEWING UNMATCHED INDIA FLOOD DISTRICTS")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

print("\nUnique unmatched combinations:", len(df))


# ---------------------------------------------------------
# Classification rules
# ---------------------------------------------------------

def classify_location(row):

    district = str(row["District"]).strip().lower()
    state = str(row["State"]).strip().lower()

    # Multi-state records
    if "," in state:
        return "MULTI_STATE"

    # Clearly descriptive/non-district locations
    descriptive_patterns = [
        "parts of",
        "many parts",
        "southern parts",
        "northern parts",
        "some parts",
        "most parts",
        "few districts",
        "many districts",
        "several other district",
        "coastal districts",
        "hilly areas",
        "ghat area",
        "greater kolkata area",
        "different parts",
        "districts of",
    ]

    for pattern in descriptive_patterns:
        if pattern in district:
            return "DESCRIPTIVE_LOCATION"

    # Historical Andhra Pradesh → Telangana cases
    telangana_historical = {
        "adilabad",
        "hyderabad",
        "karimnagar",
        "khammam",
        "mahabubnagar",
        "medak",
        "nalgonda",
        "nizamabad",
        "ranga reddy",
        "warangal",
    }

    if (
        state == "andhra pradesh"
        and district in telangana_historical
    ):
        return "HISTORICAL_STATE_CHANGE"

    # Known spelling/name variants
    known_variants = {
        "ananthapuramuamu",
        "kamrup metro",
        "mancachar",
        "marigaon",
        "kaimur (bhabua)",
        "pashchim champaran",
        "purbi champaran",
        "y.s.r.",
        "leparada",
        "dibang valley",
        "itanagar",
        "papum pare",
        "pak",
    }

    if district in known_variants:
        return "NAME_VARIANT"

    # Historical/renamed district indicators
    historical_words = [
        "old",
        "erstwhile",
        "former",
        "undivided",
    ]

    for word in historical_words:
        if word in district:
            return "HISTORICAL_NAME"

    return "REVIEW_REQUIRED"


df["review_category"] = df.apply(
    classify_location,
    axis=1
)


# ---------------------------------------------------------
# Sort
# ---------------------------------------------------------

df = df.sort_values(
    [
        "review_category",
        "State",
        "District"
    ]
)


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Summary
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("REVIEW CATEGORIES")
print("=" * 70)

print(
    df["review_category"]
    .value_counts()
    .to_string()
)


print("\n" + "=" * 70)
print("EXAMPLES BY CATEGORY")
print("=" * 70)

for category in df["review_category"].unique():

    print("\n---", category, "---")

    subset = df[
        df["review_category"] == category
    ].head(15)

    print(
        subset[
            [
                "District",
                "State",
                "review_category"
            ]
        ].to_string(index=False)
    )


print("\nSaved review file to:")
print(OUTPUT_FILE)

print("\nDONE")
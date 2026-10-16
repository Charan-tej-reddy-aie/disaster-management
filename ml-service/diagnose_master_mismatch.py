import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MAPPING_FILE = DATA_DIR / "india_flood_district_mapping_resolved.csv"
MASTER_FILE = DATA_DIR / "india_district_master.csv"

OUTPUT_FILE = DATA_DIR / "india_master_mismatch_report.csv"


print("=" * 70)
print("DIAGNOSING DISTRICT MASTER MISMATCHES")
print("=" * 70)


mapping = pd.read_csv(MAPPING_FILE)
master = pd.read_csv(MASTER_FILE)


# ---------------------------------------------------------
# Normalize
# ---------------------------------------------------------

def normalize(value):

    if pd.isna(value):
        return ""

    value = str(value).lower().strip()

    return " ".join(value.split())


mapping["canonical_state_norm"] = (
    mapping["canonical_state"]
    .apply(normalize)
)

mapping["canonical_district_norm"] = (
    mapping["canonical_district"]
    .apply(normalize)
)


master["state_norm_check"] = (
    master["state_name"]
    .apply(normalize)
)

master["district_norm_check"] = (
    master["district_name"]
    .apply(normalize)
)


# ---------------------------------------------------------
# Create master lookup
# ---------------------------------------------------------

master_pairs = set(
    zip(
        master["state_norm_check"],
        master["district_norm_check"]
    )
)


# ---------------------------------------------------------
# Find mismatches
# ---------------------------------------------------------

mapping["exists_in_master"] = mapping.apply(
    lambda row:
        (
            row["canonical_state_norm"],
            row["canonical_district_norm"]
        ) in master_pairs,
    axis=1
)


mismatch = mapping[
    ~mapping["exists_in_master"]
].copy()


# ---------------------------------------------------------
# Aggregate by canonical combination
# ---------------------------------------------------------

summary = (
    mismatch
    .groupby(
        [
            "canonical_state",
            "canonical_district",
            "resolution"
        ],
        dropna=False
    )
    .size()
    .reset_index(name="row_count")
    .sort_values(
        "row_count",
        ascending=False
    )
)


summary.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

print("\nTotal mapping rows:", len(mapping))

print(
    "Rows not found in master:",
    len(mismatch)
)

print(
    "Unique missing canonical combinations:",
    len(summary)
)


print("\n" + "=" * 70)
print("TOP CANONICAL MISMATCHES")
print("=" * 70)

print(
    summary.head(100).to_string(
        index=False
    )
)


print("\nSaved report:")
print(OUTPUT_FILE)

print("\nDONE")
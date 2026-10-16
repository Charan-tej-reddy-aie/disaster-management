import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

MISMATCH_FILE = DATA_DIR / "india_master_mismatch_report.csv"
MASTER_FILE = DATA_DIR / "india_district_master.csv"

mismatch = pd.read_csv(MISMATCH_FILE)
master = pd.read_csv(MASTER_FILE)


# Remove rows where canonical district is empty
mismatch = mismatch[
    mismatch["canonical_district"].notna()
].copy()


print("=" * 70)
print("INSPECTING CANONICAL DISTRICT MISMATCHES")
print("=" * 70)

print(
    "\nCanonical combinations to inspect:",
    len(mismatch)
)


# ---------------------------------------------------------
# For each mismatch, find same-state districts in master
# ---------------------------------------------------------

for _, row in mismatch.iterrows():

    state = row["canonical_state"]
    district = row["canonical_district"]

    print("\n" + "-" * 70)

    print(
        "Canonical:",
        district,
        "|",
        state,
        "| rows:",
        row["row_count"]
    )

    state_master = master[
        master["state_name"]
        .astype(str)
        .str.strip()
        .str.lower()
        ==
        str(state).strip().lower()
    ].copy()

    if len(state_master) == 0:

        print("  STATE NOT FOUND IN MASTER")
        continue

    # Exact district
    exact = state_master[
        state_master["district_name"]
        .astype(str)
        .str.strip()
        .str.lower()
        ==
        str(district).strip().lower()
    ]

    if len(exact) > 0:

        print("  EXACT DISTRICT FOUND:")
        print(
            exact[
                [
                    "state_name",
                    "district_name",
                    "latitude",
                    "longitude"
                ]
            ].to_string(index=False)
        )

        continue

    # Otherwise display all districts from that state
    print(
        f"  District not found exactly. "
        f"Showing districts in {state}:"
    )

    print(
        state_master[
            [
                "district_name",
                "latitude",
                "longitude"
            ]
        ].to_string(index=False)
    )


print("\n" + "=" * 70)
print("DONE")
print("=" * 70)
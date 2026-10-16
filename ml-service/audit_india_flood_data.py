import pandas as pd
from pathlib import Path

INPUT_FILE = Path(
    "data/india_flood_inventory/India_Flood_Inventory_v3.csv"
)

print("=" * 70)
print("INDIA FLOOD INVENTORY - DATA QUALITY AUDIT")
print("=" * 70)

df = pd.read_csv(INPUT_FILE)

print(f"\nTotal records: {len(df)}")

# ============================================================
# DATE ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("DATE ANALYSIS")
print("=" * 70)

df["Start_Date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)

df["End_Date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

start_missing = df["Start_Date"].isna()
end_missing = df["End_Date"].isna()

print(f"Missing Start Date: {start_missing.sum()}")
print(f"Missing End Date:   {end_missing.sum()}")

print(
    f"Both dates available: "
    f"{(~start_missing & ~end_missing).sum()}"
)

print(
    f"Only Start Date available: "
    f"{(~start_missing & end_missing).sum()}"
)

print(
    f"Only End Date available: "
    f"{(start_missing & ~end_missing).sum()}"
)

print(
    f"Both dates missing: "
    f"{(start_missing & end_missing).sum()}"
)

# ============================================================
# DATE AVAILABILITY BY STATE
# ============================================================

print("\n" + "=" * 70)
print("DATE AVAILABILITY BY STATE")
print("=" * 70)

state_date = (
    df.groupby("State")
    .agg(
        total_records=("UEI", "count"),
        valid_start=("Start_Date", lambda x: x.notna().sum()),
        valid_end=("End_Date", lambda x: x.notna().sum())
    )
)

state_date["missing_start"] = (
    state_date["total_records"] -
    state_date["valid_start"]
)

state_date["missing_end"] = (
    state_date["total_records"] -
    state_date["valid_end"]
)

state_date["usable"] = (
    state_date["valid_start"] &
    state_date["valid_end"]
)

print(
    state_date
    .sort_values("total_records", ascending=False)
    .to_string()
)

# ============================================================
# STATE NAMES
# ============================================================

print("\n" + "=" * 70)
print("STATE NAMES")
print("=" * 70)

state_counts = (
    df["State"]
    .fillna("MISSING")
    .astype(str)
    .str.strip()
    .value_counts()
)

for state, count in state_counts.items():
    print(f"{count:5d}  {state}")

# ============================================================
# DISTRICT ANALYSIS
# ============================================================

print("\n" + "=" * 70)
print("DISTRICT ANALYSIS")
print("=" * 70)

district = (
    df["Districts"]
    .fillna("MISSING")
    .astype(str)
    .str.strip()
)

print(
    f"Unique raw district values: "
    f"{district.nunique()}"
)

print("\nTop 100 district values:")

print(
    district
    .value_counts()
    .head(100)
    .to_string()
)

# ============================================================
# EMPTY / MISSING DISTRICTS
# ============================================================

print("\n" + "=" * 70)
print("MISSING DISTRICT INFORMATION")
print("=" * 70)

missing_district = (
    df["Districts"].isna() |
    (df["Districts"].astype(str).str.strip() == "")
)

print(
    f"Records with missing/empty districts: "
    f"{missing_district.sum()}"
)

# ============================================================
# MULTI-STATE EVENTS
# ============================================================

print("\n" + "=" * 70)
print("MULTI-STATE EVENTS")
print("=" * 70)

state_text = (
    df["State"]
    .fillna("")
    .astype(str)
)

multi_state = state_text.str.contains(
    ",",
    regex=False
)

print(
    f"Records containing multiple states: "
    f"{multi_state.sum()}"
)

if multi_state.sum() > 0:
    print("\nExamples:")

    print(
        df.loc[
            multi_state,
            ["UEI", "State", "Districts",
             "Start Date", "End Date"]
        ]
        .head(50)
        .to_string(index=False)
    )

# ============================================================
# SUSPICIOUS DISTRICT VALUES
# ============================================================

print("\n" + "=" * 70)
print("POTENTIALLY NON-DISTRICT VALUES")
print("=" * 70)

suspicious_words = [
    "southern",
    "northern",
    "eastern",
    "western",
    "parts",
    "area",
    "region",
    "districts",
    "state",
    "city",
    "division"
]

for word in suspicious_words:

    matches = district[
        district.str.lower().str.contains(
            word,
            regex=False,
            na=False
        )
    ].unique()

    if len(matches) > 0:

        print(f"\nContains '{word}':")

        for value in matches[:50]:
            print(f"  {value}")

# ============================================================
# DATE RANGE
# ============================================================

print("\n" + "=" * 70)
print("VALID DATE RANGE")
print("=" * 70)

valid_dates = df[
    df["Start_Date"].notna() &
    df["End_Date"].notna()
]

if len(valid_dates) > 0:

    print(
        "Earliest Start Date:",
        valid_dates["Start_Date"].min().date()
    )

    print(
        "Latest Start Date:",
        valid_dates["Start_Date"].max().date()
    )

    print(
        "Earliest End Date:",
        valid_dates["End_Date"].min().date()
    )

    print(
        "Latest End Date:",
        valid_dates["End_Date"].max().date()
    )

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("AUDIT COMPLETE")
print("=" * 70)

print(
    f"""
Total records                  : {len(df)}
Records with both dates        : {len(valid_dates)}
Records missing start date     : {start_missing.sum()}
Records missing end date       : {end_missing.sum()}
Missing district information   : {missing_district.sum()}
Multi-state records            : {multi_state.sum()}
Unique raw district values     : {district.nunique()}
Unique state values            : {state_counts.size}
"""
)
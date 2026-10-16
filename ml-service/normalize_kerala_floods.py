import pandas as pd


INPUT_FILE = "data/kerala_flood_events.csv"
OUTPUT_FILE = "data/kerala_flood_event_districts.csv"


# ============================================================
# 1. LOAD DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)

print("Original events:", len(df))


# ============================================================
# 2. REMOVE EVENTS WITHOUT DISTRICT INFORMATION
# ============================================================

df = df.dropna(
    subset=["Districts"]
).copy()

print(
    "Events with district information:",
    len(df)
)


# ============================================================
# 3. SPLIT DISTRICTS
# ============================================================

df["District"] = (
    df["Districts"]
    .astype(str)
    .str.split(",")
)


df = df.explode(
    "District"
)


# ============================================================
# 4. CLEAN DISTRICT NAMES
# ============================================================

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


# ============================================================
# 5. SELECT FINAL COLUMNS
# ============================================================

result = df[
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
].copy()


# ============================================================
# 6. REMOVE DUPLICATE EVENT-DISTRICT PAIRS
# ============================================================

result = result.drop_duplicates(
    subset=["UEI", "District"]
)


# ============================================================
# 7. SORT
# ============================================================

result = result.sort_values(
    by=["Start Date", "District"]
)


# ============================================================
# 8. SAVE
# ============================================================

result.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# 9. DISPLAY INFORMATION
# ============================================================

print("\n========================================")
print("NORMALIZED KERALA FLOOD DATASET")
print("========================================")

print(
    "Final shape:",
    result.shape
)

print(
    "Unique flood events:",
    result["UEI"].nunique()
)

print(
    "Unique districts:",
    result["District"].nunique()
)

print("\nDistrict frequency:")

print(
    result["District"]
    .value_counts()
    .to_string()
)

print("\nFirst 20 records:")

print(
    result.head(20)
    .to_string(index=False)
)

print(
    "\nSaved to:",
    OUTPUT_FILE
)
import pandas as pd


BASE = "data/india_flood_inventory/"

INPUT_FILE = BASE + "India_Flood_Inventory_v3.csv"
OUTPUT_FILE = "data/kerala_flood_events.csv"


# ============================================================
# 1. LOAD FLOOD INVENTORY
# ============================================================

df = pd.read_csv(INPUT_FILE)

print("Original records:", len(df))


# ============================================================
# 2. SELECT KERALA
# ============================================================

kerala = df[
    df["State"]
    .astype(str)
    .str.strip()
    .str.lower()
    == "kerala"
].copy()


print("Kerala flood records:", len(kerala))


# ============================================================
# 3. CONVERT DATES
# ============================================================

kerala["Start Date"] = pd.to_datetime(
    kerala["Start Date"],
    errors="coerce",
    dayfirst=True
)

kerala["End Date"] = pd.to_datetime(
    kerala["End Date"],
    errors="coerce",
    dayfirst=True
)


# ============================================================
# 4. REMOVE RECORDS WITHOUT DATES
# ============================================================

kerala = kerala.dropna(
    subset=["Start Date", "End Date"]
)


# ============================================================
# 5. SELECT USEFUL COLUMNS
# ============================================================

result = kerala[
    [
        "UEI",
        "Start Date",
        "End Date",
        "Duration(Days)",
        "Main Cause",
        "Districts",
        "State",
        "State_Codes"
    ]
].copy()


# ============================================================
# 6. CREATE FLOOD LABEL
# ============================================================

result["Flood_Occurred"] = 1


# ============================================================
# 7. SAVE
# ============================================================

result.to_csv(
    OUTPUT_FILE,
    index=False
)


print("\nDataset created successfully.")

print("Final shape:", result.shape)

print("\nColumns:")
print(result.columns.tolist())

print("\nFirst 10 records:")
print(
    result.head(10).to_string(index=False)
)

print(
    "\nSaved to:",
    OUTPUT_FILE
)
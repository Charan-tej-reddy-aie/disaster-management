import pandas as pd

BASE = "data/india_flood_inventory/"

# ============================================================
# MAIN FLOOD INVENTORY
# ============================================================

inventory = pd.read_csv(
    BASE + "India_Flood_Inventory_v3.csv"
)

print("\n========================================")
print("MAIN FLOOD INVENTORY")
print("========================================")

print("Shape:", inventory.shape)

print("\nMissing values:")
print(
    inventory.isnull().sum()
    .sort_values(ascending=False)
)

print("\nNon-null percentage:")
print(
    (inventory.notnull().mean() * 100)
    .sort_values(ascending=False)
    .round(2)
)

print("\nSeverity distribution:")
print(
    inventory["Severity"]
    .value_counts(dropna=False)
)

print("\nState distribution:")
print(
    inventory["State"]
    .value_counts()
    .head(20)
)

print("\nMain cause:")
print(
    inventory["Main Cause"]
    .value_counts(dropna=False)
)

print("\nDate range:")

inventory["Start Date"] = pd.to_datetime(
    inventory["Start Date"],
    errors="coerce",
    dayfirst=True
)

inventory["End Date"] = pd.to_datetime(
    inventory["End Date"],
    errors="coerce",
    dayfirst=True
)

print(
    "Start:",
    inventory["Start Date"].min()
)

print(
    "End:",
    inventory["End Date"].max()
)


# ============================================================
# DISTRICT FLOODED AREA
# ============================================================

area = pd.read_csv(
    BASE + "District_FloodedArea.csv"
)

print("\n========================================")
print("DISTRICT FLOODED AREA")
print("========================================")

print("Shape:", area.shape)

print("\nMissing values:")
print(area.isnull().sum())

print("\nStatistics:")
print(
    area.describe()
)


# ============================================================
# DISTRICT FLOOD IMPACT
# ============================================================

impact = pd.read_csv(
    BASE + "District_FloodImpact.csv"
)

print("\n========================================")
print("DISTRICT FLOOD IMPACT")
print("========================================")

print("Shape:", impact.shape)

print("\nMissing values:")
print(impact.isnull().sum())

print("\nStatistics:")
print(
    impact.describe()
)
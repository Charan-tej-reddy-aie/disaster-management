import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

INPUT_FILE = DATA_DIR / "india_district_master.csv"
OUTPUT_FILE = DATA_DIR / "india_district_coordinate_audit.csv"

df = pd.read_csv(INPUT_FILE)

print("=" * 70)
print("VALIDATING INDIA DISTRICT COORDINATES")
print("=" * 70)

print("\nTotal master rows:", len(df))


# ---------------------------------------------------------
# Basic coordinate validation
# ---------------------------------------------------------

df["coordinate_valid"] = (
    df["latitude"].between(-90, 90)
    &
    df["longitude"].between(-180, 180)
)

# India approximate geographic bounds
df["inside_india_bounds"] = (
    df["latitude"].between(6, 37)
    &
    df["longitude"].between(68, 98)
)


# ---------------------------------------------------------
# Flag suspicious coordinates
# ---------------------------------------------------------

df["coordinate_status"] = "VALID"

df.loc[
    ~df["coordinate_valid"],
    "coordinate_status"
] = "INVALID"

df.loc[
    df["coordinate_valid"]
    &
    ~df["inside_india_bounds"],
    "coordinate_status"
] = "OUTSIDE_INDIA"


# ---------------------------------------------------------
# Find duplicate coordinates
# ---------------------------------------------------------

duplicate_coordinates = (
    df.groupby(
        ["latitude", "longitude"]
    )
    .size()
    .reset_index(name="count")
)

duplicate_coordinates = duplicate_coordinates[
    duplicate_coordinates["count"] > 1
]


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

print("\nCoordinate status:")
print(
    df["coordinate_status"]
    .value_counts()
    .to_string()
)


print("\nDuplicate coordinate pairs:")
print(len(duplicate_coordinates))


print("\n" + "=" * 70)
print("SUSPICIOUS COORDINATES")
print("=" * 70)

suspicious = df[
    df["coordinate_status"] != "VALID"
]

if len(suspicious) > 0:
    print(
        suspicious[
            [
                "state_name",
                "district_name",
                "latitude",
                "longitude",
                "coordinate_status"
            ]
        ].to_string(index=False)
    )
else:
    print("No coordinates outside basic India bounds.")


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nSaved audit:")
print(OUTPUT_FILE)

print("\nDONE")
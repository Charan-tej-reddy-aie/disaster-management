from pathlib import Path
import pandas as pd
import geopandas as gpd

BASE_DIR = Path(__file__).resolve().parents[1]

WEATHER_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "weather_features.csv"
)

ADM1_FILE = (
    BASE_DIR
    / "data"
    / "boundaries"
    / "IND_ADM1.geojson"
)

ADM2_FILE = (
    BASE_DIR
    / "data"
    / "boundaries"
    / "IND_ADM2.geojson"
)

OUTPUT_DIR = BASE_DIR / "data" / "boundaries"

OUTPUT_FILE = OUTPUT_DIR / "coordinate_admin_mapping.csv"


CHUNK_SIZE = 250_000


print("=" * 70)
print("INDIA WEATHER COORDINATE → ADMINISTRATIVE MAPPING")
print("=" * 70)


# ============================================================
# CHECK FILES
# ============================================================

for file_path in [WEATHER_FILE, ADM1_FILE, ADM2_FILE]:
    if not file_path.exists():
        raise FileNotFoundError(
            f"\nRequired file not found:\n{file_path}"
        )


# ============================================================
# STEP 1 — EXTRACT UNIQUE COORDINATES
# ============================================================

print("\n[1/4] Reading weather coordinates...")

unique_parts = []

chunk_number = 0

for chunk in pd.read_csv(
    WEATHER_FILE,
    usecols=["latitude", "longitude"],
    chunksize=CHUNK_SIZE
):

    chunk_number += 1

    chunk = chunk.dropna(
        subset=["latitude", "longitude"]
    )

    chunk = chunk.drop_duplicates(
        subset=["latitude", "longitude"]
    )

    unique_parts.append(chunk)

    print(
        f"  Processed chunk {chunk_number} "
        f"| unique in chunk: {len(chunk):,}"
    )


coordinates = pd.concat(
    unique_parts,
    ignore_index=True
)

coordinates = coordinates.drop_duplicates(
    subset=["latitude", "longitude"]
).reset_index(drop=True)


print(
    f"\nTotal unique coordinates: "
    f"{len(coordinates):,}"
)


# ============================================================
# STEP 2 — LOAD STATE BOUNDARIES
# ============================================================

print("\n[2/4] Loading India state boundaries...")

adm1 = gpd.read_file(ADM1_FILE)

print(
    f"State boundary features: "
    f"{len(adm1):,}"
)

print(
    f"State property: "
    f"{adm1['NAME'].tolist()}"
)


# ============================================================
# STEP 3 — LOAD DISTRICT BOUNDARIES
# ============================================================

print("\n[3/4] Loading India district boundaries...")

adm2 = gpd.read_file(ADM2_FILE)

print(
    f"District boundary features: "
    f"{len(adm2):,}"
)


# ============================================================
# CREATE POINT GEOMETRIES
# ============================================================

points = gpd.GeoDataFrame(
    coordinates.copy(),
    geometry=gpd.points_from_xy(
        coordinates["longitude"],
        coordinates["latitude"]
    ),
    crs="EPSG:4326"
)


# ============================================================
# STATE MATCHING
# ============================================================

print("\nMatching coordinates to states...")

state_join = gpd.sjoin(
    points,
    adm1[["NAME", "ISO_Code", "geometry"]],
    how="left",
    predicate="within"
)

state_join = state_join.drop(
    columns=["index_right"],
    errors="ignore"
)

state_join = state_join.rename(
    columns={
        "NAME": "state_name",
        "ISO_Code": "state_iso"
    }
)


# ============================================================
# DISTRICT MATCHING
# ============================================================

print("Matching coordinates to districts...")

district_join = gpd.sjoin(
    points,
    adm2[["Name", "geometry"]],
    how="left",
    predicate="within"
)

district_join = district_join.drop(
    columns=["index_right"],
    errors="ignore"
)

district_join = district_join.rename(
    columns={
        "Name": "district_name"
    }
)


# ============================================================
# COMBINE RESULTS
# ============================================================

result = coordinates.copy()

result["state_name"] = state_join[
    "state_name"
].values

result["state_iso"] = state_join[
    "state_iso"
].values

result["district_name"] = district_join[
    "district_name"
].values


# ============================================================
# CREATE COORDINATE ID
# ============================================================

result["coordinate_id"] = (
    result["latitude"].astype(str)
    + "|"
    + result["longitude"].astype(str)
)


# ============================================================
# REORDER COLUMNS
# ============================================================

result = result[
    [
        "coordinate_id",
        "latitude",
        "longitude",
        "state_name",
        "state_iso",
        "district_name"
    ]
]


# ============================================================
# STATISTICS
# ============================================================

matched_state = result["state_name"].notna()

matched_district = result["district_name"].notna()

print("\n" + "=" * 70)
print("MAPPING RESULTS")
print("=" * 70)

print(
    f"\nTotal coordinates : {len(result):,}"
)

print(
    f"State matched     : {matched_state.sum():,}"
)

print(
    f"State unmatched   : {(~matched_state).sum():,}"
)

print(
    f"District matched  : {matched_district.sum():,}"
)

print(
    f"District unmatched: {(~matched_district).sum():,}"
)


# ============================================================
# STATE DISTRIBUTION
# ============================================================

print("\n" + "=" * 70)
print("COORDINATES PER STATE")
print("=" * 70)

state_counts = (
    result["state_name"]
    .value_counts()
)

print(state_counts.to_string())


# ============================================================
# SAVE
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

result.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n" + "=" * 70)
print("COMPLETE")
print("=" * 70)

print(
    f"\nOutput:\n{OUTPUT_FILE}"
)
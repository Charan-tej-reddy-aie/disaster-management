from pathlib import Path
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[1]

WEATHER_FILE = BASE_DIR / "data/processed/weather_features.csv"
COORD_FILE = BASE_DIR / "data/boundaries/coordinate_admin_mapping.csv"
EVENT_FILE = BASE_DIR / "data/disasters/emdat_event_region_map.csv"

OUTPUT_DIR = BASE_DIR / "data/final"
OUTPUT_FILE = OUTPUT_DIR / "disaster_ml_dataset.csv"

CHUNK_SIZE = 250_000


# ------------------------------------------------------------
# Load coordinate → administrative mapping
# ------------------------------------------------------------

print("=" * 70)
print("BUILDING FINAL ML DATASET")
print("=" * 70)

print("\nLoading coordinate mapping...")

coords = pd.read_csv(COORD_FILE)

coords["coordinate_id"] = (
    coords["latitude"].astype(str)
    + "|"
    + coords["longitude"].astype(str)
)

coords = coords[
    [
        "coordinate_id",
        "latitude",
        "longitude",
        "state_name",
        "district_name"
    ]
].drop_duplicates("coordinate_id")

print(f"Coordinates: {len(coords):,}")


# ------------------------------------------------------------
# Load disaster events
# ------------------------------------------------------------

print("\nLoading disaster events...")

events = pd.read_csv(EVENT_FILE)

events["start_date"] = pd.to_datetime(
    events["start_date"],
    errors="coerce"
)

events["end_date"] = pd.to_datetime(
    events["end_date"],
    errors="coerce"
)

events["end_date"] = events["end_date"].fillna(
    events["start_date"]
)


# ------------------------------------------------------------
# Keep weather-related classes
# ------------------------------------------------------------

label_map = {
    "FLOOD": "FLOOD",
    "GLACIAL_LAKE_OUTBURST_FLOOD": "FLOOD",
    "CYCLONE": "CYCLONE",
    "DROUGHT": "DROUGHT",
    "HEATWAVE": "HEATWAVE",
    "MASS_MOVEMENT_(WET)": "LANDSLIDE",
    "MASS_MOVEMENT": "LANDSLIDE",
    "WILDFIRE": "WILDFIRE"
}

events["ml_label"] = events["disaster_label"].map(label_map)

events = events[
    events["ml_label"].notna()
].copy()

# Ignore unmatched regions for this first model
events = events[
    events["region_type"] != "UNMATCHED"
].copy()

print(
    f"Usable event-region records: {len(events):,}"
)


# ------------------------------------------------------------
# Normalize region names
# ------------------------------------------------------------

events["region_name"] = (
    events["region_name"]
    .astype(str)
    .str.strip()
    .str.lower()
)

coords["state_key"] = (
    coords["state_name"]
    .astype(str)
    .str.strip()
    .str.lower()
)

coords["district_key"] = (
    coords["district_name"]
    .fillna("")
    .astype(str)
    .str.strip()
    .str.lower()
)


# ------------------------------------------------------------
# Create lookup structures
# ------------------------------------------------------------

district_events = events[
    events["region_type"] == "DISTRICT"
].copy()

state_events = events[
    events["region_type"] == "STATE"
].copy()


# ------------------------------------------------------------
# Process weather data
# ------------------------------------------------------------

print("\nProcessing weather data...")

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

# Remove old output
if OUTPUT_FILE.exists():
    OUTPUT_FILE.unlink()

first_write = True

total_rows = 0
total_labeled = 0


for chunk_no, weather in enumerate(
    pd.read_csv(
        WEATHER_FILE,
        chunksize=CHUNK_SIZE
    ),
    start=1
):

    print(
        f"\nChunk {chunk_no}: "
        f"{len(weather):,} rows"
    )

    # --------------------------------------------------------
    # Date
    # --------------------------------------------------------

    weather["date"] = pd.to_datetime(
        weather["time"],
        errors="coerce"
    ).dt.normalize()

    # --------------------------------------------------------
    # Coordinate ID
    # --------------------------------------------------------

    weather["coordinate_id"] = (
        weather["latitude"].astype(str)
        + "|"
        + weather["longitude"].astype(str)
    )

    # --------------------------------------------------------
    # Add state/district
    # --------------------------------------------------------

    weather = weather.merge(
        coords[
            [
                "coordinate_id",
                "state_name",
                "district_name"
            ]
        ],
        on="coordinate_id",
        how="left"
    )

    weather["state_key"] = (
        weather["state_name"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
    )

    weather["district_key"] = (
        weather["district_name"]
        .fillna("")
        .astype(str)
        .str.strip()
        .str.lower()
    )

    weather["disaster_label"] = "NORMAL"
    weather["disaster_event_id"] = ""

    # --------------------------------------------------------
    # District-level matching
    # --------------------------------------------------------

    for _, event in district_events.iterrows():

        mask = (
            (weather["district_key"] == event["region_name"])
            &
            (weather["date"] >= event["start_date"])
            &
            (weather["date"] <= event["end_date"])
        )

        weather.loc[
            mask,
            "disaster_label"
        ] = event["ml_label"]

        weather.loc[
            mask,
            "disaster_event_id"
        ] = event["event_id"]

    # --------------------------------------------------------
    # State-level matching
    # --------------------------------------------------------

    for _, event in state_events.iterrows():

        mask = (
            (weather["state_key"] == event["region_name"])
            &
            (weather["date"] >= event["start_date"])
            &
            (weather["date"] <= event["end_date"])
            &
            (weather["disaster_label"] == "NORMAL")
        )

        weather.loc[
            mask,
            "disaster_label"
        ] = event["ml_label"]

        weather.loc[
            mask,
            "disaster_event_id"
        ] = event["event_id"]

    labeled = (
        weather["disaster_label"] != "NORMAL"
    ).sum()

    total_rows += len(weather)
    total_labeled += labeled

    print(
        f"  Disaster-labeled: {labeled:,}"
    )

    # --------------------------------------------------------
    # Remove helper columns
    # --------------------------------------------------------

    weather = weather.drop(
        columns=[
            "state_key",
            "district_key"
        ],
        errors="ignore"
    )

    # --------------------------------------------------------
    # Write output
    # --------------------------------------------------------

    weather.to_csv(
        OUTPUT_FILE,
        mode="w" if first_write else "a",
        header=first_write,
        index=False
    )

    first_write = False


# ------------------------------------------------------------
# Final report
# ------------------------------------------------------------

print("\n" + "=" * 70)
print("ML DATASET COMPLETE")
print("=" * 70)

print(f"Total rows      : {total_rows:,}")
print(f"Labeled rows    : {total_labeled:,}")
print(
    f"Normal rows     : "
    f"{total_rows - total_labeled:,}"
)

print(f"\nOutput:")
print(OUTPUT_FILE)

print("=" * 70)
from pathlib import Path
import pandas as pd
import geopandas as gpd
import json
import re
import ast


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

EVENT_FILE = (
    BASE_DIR
    / "data"
    / "disasters"
    / "emdat_events_clean.csv"
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

OUTPUT_DIR = BASE_DIR / "data" / "disasters"

OUTPUT_FILE = (
    OUTPUT_DIR
    / "emdat_event_region_map.csv"
)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_name(value):
    """
    Normalize administrative names for matching.
    """

    if value is None:
        return ""

    value = str(value).strip().lower()

    # Remove common administrative words
    value = re.sub(
        r"\b(district|districts|province|provinces)\b",
        " ",
        value
    )

    # Common historical/current naming differences
    replacements = {
        "orissa": "odisha",
        "pondicherry": "puducherry",
        "uttaranchal": "uttarakhand",
        "nct of delhi": "delhi",
        "jammu & kashmir": "jammu and kashmir",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    # Remove punctuation
    value = re.sub(r"[^a-z0-9\s]", " ", value)

    # Normalize whitespace
    value = re.sub(r"\s+", " ", value)

    return value.strip()


# ============================================================
# PARSE EM-DAT ADMIN JSON
# ============================================================

def parse_admin_units(value):
    """
    Extract names from EM-DAT Admin Units / GADM Admin Units.

    Handles strings such as:

    [{"adm1_name":"Goa"},{"adm1_name":"Kerala"}]

    and

    [{"name_2":"Kendrapara"}]
    """

    if pd.isna(value):
        return []

    text = str(value).strip()

    if not text:
        return []

    # Try JSON
    try:
        data = json.loads(text)

        if isinstance(data, list):
            return data

        return []

    except Exception:
        pass

    # Try Python literal
    try:
        data = ast.literal_eval(text)

        if isinstance(data, list):
            return data

    except Exception:
        pass

    return []


# ============================================================
# LOAD BOUNDARIES
# ============================================================

print("=" * 70)
print("EM-DAT EVENT → ADMINISTRATIVE REGION MAPPING")
print("=" * 70)

print("\nLoading boundaries...")

adm1 = gpd.read_file(ADM1_FILE)
adm2 = gpd.read_file(ADM2_FILE)

state_names = {
    normalize_name(x): x
    for x in adm1["NAME"].dropna()
}

district_names = {
    normalize_name(x): x
    for x in adm2["Name"].dropna()
}

print(f"States   : {len(state_names)}")
print(f"Districts: {len(district_names)}")


# ============================================================
# LOAD EVENTS
# ============================================================

print("\nLoading EM-DAT events...")

events = pd.read_csv(EVENT_FILE)

print(f"Events: {len(events):,}")


# ============================================================
# EVENT → REGIONS
# ============================================================

records = []

for _, event in events.iterrows():

    event_id = event["DisNo."]
    disaster_label = event["disaster_label"]

    start_date = event["start_date"]
    end_date = event["end_date"]

    if pd.isna(start_date):
        continue

    if pd.isna(end_date):
        end_date = start_date

    # --------------------------------------------------------
    # 1. GADM ADMIN UNITS
    # --------------------------------------------------------

    gadm_units = parse_admin_units(
        event.get("gadm_admin_units", "")
    )

    matched_states = set()
    matched_districts = set()

    for unit in gadm_units:

        if not isinstance(unit, dict):
            continue

        # ADM1
        for key in [
            "name_1",
            "adm1_name"
        ]:
            if key in unit and unit[key]:
                normalized = normalize_name(unit[key])

                if normalized in state_names:
                    matched_states.add(
                        state_names[normalized]
                    )

        # ADM2
        for key in [
            "name_2",
            "adm2_name"
        ]:
            if key in unit and unit[key]:
                normalized = normalize_name(unit[key])

                if normalized in district_names:
                    matched_districts.add(
                        district_names[normalized]
                    )

    # --------------------------------------------------------
    # 2. ADMIN UNITS FALLBACK
    # --------------------------------------------------------

    if not matched_states and not matched_districts:

        admin_units = parse_admin_units(
            event.get("admin_units", "")
        )

        for unit in admin_units:

            if not isinstance(unit, dict):
                continue

            for key in [
                "adm1_name",
                "name_1"
            ]:
                if key in unit and unit[key]:
                    normalized = normalize_name(unit[key])

                    if normalized in state_names:
                        matched_states.add(
                            state_names[normalized]
                        )

            for key in [
                "adm2_name",
                "name_2"
            ]:
                if key in unit and unit[key]:
                    normalized = normalize_name(unit[key])

                    if normalized in district_names:
                        matched_districts.add(
                            district_names[normalized]
                        )

    # --------------------------------------------------------
    # 3. LOCATION STRING FALLBACK
    # --------------------------------------------------------

    location = str(
        event.get("location", "")
    )

    location_normalized = normalize_name(location)

    # Match state names appearing in location
    for normalized, original in state_names.items():

        if (
            normalized
            and normalized in location_normalized
        ):
            matched_states.add(original)

    # Match district names appearing in location
    for normalized, original in district_names.items():

        if (
            normalized
            and len(normalized) >= 4
            and normalized in location_normalized
        ):
            matched_districts.add(original)

    # --------------------------------------------------------
    # 4. COORDINATE FALLBACK
    # --------------------------------------------------------

    latitude = event.get("Latitude")
    longitude = event.get("Longitude")

    coordinate_available = (
        pd.notna(latitude)
        and pd.notna(longitude)
    )

    # --------------------------------------------------------
    # CREATE RECORDS
    # --------------------------------------------------------

    # District records are more precise.
    for district in sorted(matched_districts):

        records.append({
            "event_id": event_id,
            "disaster_label": disaster_label,
            "start_date": start_date,
            "end_date": end_date,
            "region_type": "DISTRICT",
            "region_name": district,
            "latitude": latitude,
            "longitude": longitude,
            "coordinate_available": coordinate_available
        })

    # State records only when no district was identified.
    if not matched_districts:

        for state in sorted(matched_states):

            records.append({
                "event_id": event_id,
                "disaster_label": disaster_label,
                "start_date": start_date,
                "end_date": end_date,
                "region_type": "STATE",
                "region_name": state,
                "latitude": latitude,
                "longitude": longitude,
                "coordinate_available": coordinate_available
            })

    # If absolutely nothing matched, keep the event for inspection.
    if not matched_states and not matched_districts:

        records.append({
            "event_id": event_id,
            "disaster_label": disaster_label,
            "start_date": start_date,
            "end_date": end_date,
            "region_type": "UNMATCHED",
            "region_name": "",
            "latitude": latitude,
            "longitude": longitude,
            "coordinate_available": coordinate_available
        })


# ============================================================
# CREATE DATAFRAME
# ============================================================

mapping = pd.DataFrame(records)

if mapping.empty:
    raise RuntimeError(
        "No event-region mappings were generated."
    )


# ============================================================
# REMOVE DUPLICATES
# ============================================================

mapping = mapping.drop_duplicates(
    subset=[
        "event_id",
        "region_type",
        "region_name"
    ]
)


# ============================================================
# SAVE
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

mapping.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 70)
print("MAPPING RESULTS")
print("=" * 70)

print(
    f"\nTotal mapping records : {len(mapping):,}"
)

print(
    f"Unique events mapped  : "
    f"{mapping['event_id'].nunique():,}"
)

print(
    f"Unmatched events      : "
    f"{(mapping['region_type'] == 'UNMATCHED').sum():,}"
)

print("\nRegion type:")

print(
    mapping["region_type"]
    .value_counts()
    .to_string()
)

print("\nDisaster type:")

print(
    mapping["disaster_label"]
    .value_counts()
    .to_string()
)


# ============================================================
# SHOW UNMATCHED EVENTS
# ============================================================

unmatched = mapping[
    mapping["region_type"] == "UNMATCHED"
]

if len(unmatched) > 0:

    print("\n" + "=" * 70)
    print("UNMATCHED EVENTS")
    print("=" * 70)

    print(
        unmatched[
            [
                "event_id",
                "disaster_label",
                "start_date",
                "end_date"
            ]
        ].to_string(index=False)
    )


print("\n" + "=" * 70)
print("COMPLETE")
print("=" * 70)

print(f"\nOutput:")
print(OUTPUT_FILE)
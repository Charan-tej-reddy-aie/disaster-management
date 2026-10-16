from pathlib import Path
import pandas as pd
import re


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

REQUIREMENTS_FILE = (
    BASE_DIR / "data" / "india_weather_requirements.csv"
)

COORDINATES_FILE = (
    BASE_DIR / "data" / "india_district_coordinates_final.csv"
)

OUTPUT_FILE = (
    BASE_DIR / "data" / "india_weather_requirements_final.csv"
)

REVIEW_FILE = (
    BASE_DIR / "data" / "india_weather_requirements_review.csv"
)


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(value):

    if pd.isna(value):
        return ""

    value = str(value).lower().strip()

    # Remove non-alphanumeric characters
    value = re.sub(r"[^a-z0-9\s]", " ", value)

    # Normalize spaces
    value = re.sub(r"\s+", " ", value)

    return value.strip()


# ============================================================
# HEADER
# ============================================================

print("=" * 70)
print("PREPARING FINAL WEATHER REQUIREMENTS")
print("=" * 70)


# ============================================================
# LOAD DATA
# ============================================================

requirements = pd.read_csv(REQUIREMENTS_FILE)
coordinates = pd.read_csv(COORDINATES_FILE)

print(
    f"\nWeather requirements: {len(requirements):,}"
)

print(
    f"Coordinate records:   {len(coordinates):,}"
)


# ============================================================
# CHECK COLUMNS
# ============================================================

required_req_columns = [
    "State",
    "District",
    "Flood_Records",
    "First_Flood_Date",
    "Last_Flood_Date",
    "First_Flood_Year",
    "Last_Flood_Year",
    "Years_Needed",
]

required_coord_columns = [
    "state_name",
    "district_name",
    "latitude",
    "longitude",
    "geocoded_name",
    "geocoded_admin1",
    "geocoded_admin2",
    "coordinate_source",
    "coordinate_status",
]

missing_req = [
    c for c in required_req_columns
    if c not in requirements.columns
]

missing_coord = [
    c for c in required_coord_columns
    if c not in coordinates.columns
]

if missing_req:
    raise ValueError(
        f"Missing requirement columns: {missing_req}"
    )

if missing_coord:
    raise ValueError(
        f"Missing coordinate columns: {missing_coord}"
    )


# ============================================================
# REMOVE MULTI-STATE RECORDS
# ============================================================

multi_state_mask = (
    requirements["State"]
    .astype(str)
    .str.contains(",", na=False)
)

multi_state = requirements[
    multi_state_mask
].copy()

single_state = requirements[
    ~multi_state_mask
].copy()

print(
    f"\nMulti-state records excluded: "
    f"{len(multi_state):,}"
)

print(
    f"Single-state requirements: "
    f"{len(single_state):,}"
)


# ============================================================
# NORMALIZE STATES
# ============================================================

single_state["state_match"] = (
    single_state["State"]
    .apply(normalize_text)
)

coordinates["state_match"] = (
    coordinates["state_name"]
    .apply(normalize_text)
)


# ============================================================
# NORMALIZE DISTRICTS
# ============================================================

single_state["district_match"] = (
    single_state["District"]
    .apply(normalize_text)
)

coordinates["district_match"] = (
    coordinates["district_name"]
    .apply(normalize_text)
)


# ============================================================
# STATE ALIASES
# ============================================================

state_aliases = {

    "andaman nicobar islands":
        "andaman nicobar",

    "jammu and kashmir":
        "jammu kashmir",

    "nct of delhi":
        "delhi",

    "pondicherry":
        "puducherry",
}


single_state["state_match"] = (
    single_state["state_match"]
    .replace(state_aliases)
)

coordinates["state_match"] = (
    coordinates["state_match"]
    .replace(state_aliases)
)


# ============================================================
# DISTRICT ALIASES
# ============================================================

district_aliases = {

    # Andhra Pradesh
    "anantapuramuamu":
        "anantapur",

    "sripotti sriramulu nellore":
        "nellore",

    "sri potti sriramulu nellore":
        "nellore",

    "ysr":
        "kadapa",

    # Karnataka
    "bagalkotee":
        "bagalkote",

    "beedar":
        "bidar",

    "chamarajanagaraa":
        "chamarajanagara",

    "mangalore":
        "dakshina kannada",

    # Uttar Pradesh
    "kheri":
        "lakhimpur kheri",

    "mahrajganj":
        "maharajganj",

    "shrawasti":
        "shravasti",

    "s shrawasti":
        "shravasti",

    # Maharashtra
    "dharashiv":
        "osmanabad",

    # Madhya Pradesh
    "narmadapuram":
        "hoshangabad",

    "khargone khargone west nimar":
        "khargone",

    # Gujarat
    "kachchh":
        "kutch",

    # Sikkim
    "gangtok":
        "east sikkim",

    "gyalshing":
        "west sikkim",

    "namchi":
        "south sikkim",

    "mangan":
        "north sikkim",

    # Tripura
    "unakoti":
        "unokoti",

    # Punjab
    "shahid bhagat singh nagar":
        "shaheed bhagat singh nagar",

    # Tamil Nadu
    "kanniyakumari":
        "kanyakumari",

    # Kerala
    "malikkeri":
        "malappuram",
}


single_state["district_match"] = (
    single_state["district_match"]
    .replace(district_aliases)
)


# ============================================================
# PERFORM MATCH
# ============================================================

coordinate_columns = [
    "state_match",
    "district_match",
    "state_name",
    "district_name",
    "latitude",
    "longitude",
    "geocoded_name",
    "geocoded_admin1",
    "geocoded_admin2",
    "coordinate_source",
    "coordinate_status",
]

merged = single_state.merge(
    coordinates[coordinate_columns],
    on=[
        "state_match",
        "district_match",
    ],
    how="left",
    indicator=True,
)


# ============================================================
# MATCHED / UNMATCHED
# ============================================================

matched = merged[
    merged["_merge"] == "both"
].copy()

unmatched = merged[
    merged["_merge"] == "left_only"
].copy()


print(
    f"\nSuccessfully matched: "
    f"{len(matched):,}"
)

print(
    f"Still unmatched: "
    f"{len(unmatched):,}"
)


# ============================================================
# COORDINATE VALIDATION
# ============================================================

def valid_coordinate(row):

    try:
        lat = float(row["latitude"])
        lon = float(row["longitude"])

        if not (-35 <= lat <= 38):
            return False

        if not (65 <= lon <= 100):
            return False

        return True

    except:
        return False


if len(matched) > 0:

    matched["coordinate_valid"] = (
        matched.apply(
            valid_coordinate,
            axis=1
        )
    )

else:

    matched["coordinate_valid"] = []


invalid_coordinates = matched[
    ~matched["coordinate_valid"]
].copy()

matched = matched[
    matched["coordinate_valid"]
].copy()


print(
    f"Invalid coordinates removed: "
    f"{len(invalid_coordinates):,}"
)


# ============================================================
# FINAL OUTPUT COLUMNS
# ============================================================

final_columns = [

    "State",
    "District",

    "Flood_Records",

    "First_Flood_Date",
    "Last_Flood_Date",

    "First_Flood_Year",
    "Last_Flood_Year",

    "Years_Needed",

    "state_name",
    "district_name",

    "latitude",
    "longitude",

    "geocoded_name",
    "geocoded_admin1",
    "geocoded_admin2",

    "coordinate_source",
    "coordinate_status",

]


# ============================================================
# SAVE FINAL FILE
# ============================================================

matched[
    final_columns
].to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SAVE REVIEW FILE
# ============================================================

review_columns = [

    "State",
    "District",

    "Flood_Records",

    "First_Flood_Year",
    "Last_Flood_Year",

    "Years_Needed",

]


unmatched[
    review_columns
].to_csv(
    REVIEW_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 70)
print("FINAL WEATHER REQUIREMENT SUMMARY")
print("=" * 70)

print(
    f"\nOriginal requirements: "
    f"{len(requirements):,}"
)

print(
    f"Multi-state excluded: "
    f"{len(multi_state):,}"
)

print(
    f"Single-state requirements: "
    f"{len(single_state):,}"
)

print(
    f"Matched with coordinates: "
    f"{len(matched):,}"
)

print(
    f"Unmatched: "
    f"{len(unmatched):,}"
)

print(
    f"Invalid coordinates: "
    f"{len(invalid_coordinates):,}"
)


# ============================================================
# WEATHER VOLUME
# ============================================================

if len(matched) > 0:

    total_years = (
        matched["Years_Needed"]
        .sum()
    )

    print(
        f"\nTotal district-years required: "
        f"{total_years:,}"
    )

    print(
        f"Average years per district: "
        f"{matched['Years_Needed'].mean():.2f}"
    )

    print(
        f"Maximum years for one district: "
        f"{matched['Years_Needed'].max():.0f}"
    )


# ============================================================
# TOP DISTRICTS
# ============================================================

print("\n" + "=" * 70)
print("TOP 20 DISTRICTS")
print("=" * 70)

if len(matched) > 0:

    top = (
        matched
        .sort_values(
            "Flood_Records",
            ascending=False
        )
        .head(20)
    )

    print(
        top[
            [
                "State",
                "District",
                "Flood_Records",
                "First_Flood_Year",
                "Last_Flood_Year",
                "Years_Needed",
            ]
        ].to_string(index=False)
    )


# ============================================================
# UNMATCHED DISTRICTS
# ============================================================

print("\n" + "=" * 70)
print("UNMATCHED DISTRICTS — FIRST 50")
print("=" * 70)

if len(unmatched) > 0:

    print(
        unmatched[
            review_columns
        ]
        .head(50)
        .to_string(index=False)
    )

else:

    print("No unmatched districts.")


# ============================================================
# OUTPUT
# ============================================================

print("\n" + "=" * 70)
print("FILES CREATED")
print("=" * 70)

print(
    f"\nFinal:"
    f"\n{OUTPUT_FILE}"
)

print(
    f"\nReview:"
    f"\n{REVIEW_FILE}"
)

print("\nCompleted successfully.")
print("=" * 70)
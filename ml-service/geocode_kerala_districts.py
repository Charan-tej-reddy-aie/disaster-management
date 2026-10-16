import pandas as pd
import requests
import time


INPUT_FILE = "data/kerala_flood_event_districts.csv"
OUTPUT_FILE = "data/kerala_district_coordinates.csv"

GEOCODING_URL = (
    "https://geocoding-api.open-meteo.com/v1/search"
)


# ============================================================
# 1. LOAD FLOOD DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)

districts = sorted(
    df["District"]
    .dropna()
    .unique()
)

print("Unique district names found:")
print(districts)

print(
    "\nNumber of unique districts:",
    len(districts)
)


# ============================================================
# 2. GEOCODE EACH DISTRICT
# ============================================================

results = []

for district in districts:

    print(
        f"\nSearching: {district}"
    )

    params = {
        "name": f"{district}, Kerala",
        "count": 5,
        "language": "en",
        "format": "json",
        "countryCode": "IN"
    }

    try:

        response = requests.get(
            GEOCODING_URL,
            params=params,
            timeout=30
        )

        response.raise_for_status()

        data = response.json()

        locations = data.get(
            "results",
            []
        )

        if not locations:

            print(
                f"  WARNING: No result for {district}"
            )

            results.append({
                "District": district,
                "Latitude": None,
                "Longitude": None,
                "Elevation": None,
                "Timezone": None,
                "Matched_Name": None
            })

            continue


        # ----------------------------------------------------
        # Prefer a result whose admin1 is Kerala
        # ----------------------------------------------------

        kerala_results = [
            x for x in locations
            if str(x.get("admin1", "")).lower()
            == "kerala"
        ]

        location = (
            kerala_results[0]
            if kerala_results
            else locations[0]
        )


        results.append({
            "District": district,

            "Latitude":
                location.get("latitude"),

            "Longitude":
                location.get("longitude"),

            "Elevation":
                location.get("elevation"),

            "Timezone":
                location.get("timezone"),

            "Matched_Name":
                location.get("name")
        })


        print(
            f"  Matched: {location.get('name')}"
        )

        print(
            f"  Coordinates: "
            f"{location.get('latitude')}, "
            f"{location.get('longitude')}"
        )


    except Exception as error:

        print(
            f"  ERROR: {error}"
        )

        results.append({
            "District": district,
            "Latitude": None,
            "Longitude": None,
            "Elevation": None,
            "Timezone": None,
            "Matched_Name": None
        })


    # Avoid sending requests too quickly
    time.sleep(0.2)


# ============================================================
# 3. SAVE RESULTS
# ============================================================

coordinates = pd.DataFrame(
    results
)

coordinates.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# 4. SUMMARY
# ============================================================

print("\n========================================")
print("GEOCODING COMPLETE")
print("========================================")

print(
    "Total districts:",
    len(coordinates)
)

print(
    "Successfully matched:",
    coordinates["Latitude"].notna().sum()
)

print(
    "Unmatched:",
    coordinates["Latitude"].isna().sum()
)

print("\nResults:")

print(
    coordinates.to_string(index=False)
)

print(
    "\nSaved to:",
    OUTPUT_FILE
)
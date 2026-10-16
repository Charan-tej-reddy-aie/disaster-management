import requests
import pandas as pd
import time

INPUT_FILE = "data/kerala_flood_event_districts_clean.csv"
OUTPUT_FILE = "data/kerala_district_coordinates.csv"

df = pd.read_csv(INPUT_FILE)

districts = sorted(df["District"].unique())

# Open-Meteo may not return Wayanad by its district name.
# Use a known representative coordinate for Wayanad.
manual_coordinates = {
    "Wayanad": {
        "Latitude": 11.6854,
        "Longitude": 76.1320,
        "Elevation": None,
        "Timezone": "Asia/Kolkata",
        "Matched_Name": "Wayanad",
        "Admin1": "Kerala"
    }
}

results = []

for district in districts:
    if district in manual_coordinates:
        print(f"Using manual coordinates: {district}")

        results.append({
            "District": district,
            **manual_coordinates[district]
        })

        continue

    print(f"Searching: {district}")

    url = "https://geocoding-api.open-meteo.com/v1/search"

    params = {
        "name": district,
        "count": 5,
        "language": "en",
        "countryCode": "IN"
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        if "results" not in data or not data["results"]:
            print(f"  ❌ No result found")
            continue

        # Prefer Kerala result
        selected = None

        for result in data["results"]:
            admin1 = result.get("admin1", "")

            if admin1.lower() == "kerala":
                selected = result
                break

        if selected is None:
            selected = data["results"][0]

        results.append({
            "District": district,
            "Latitude": selected.get("latitude"),
            "Longitude": selected.get("longitude"),
            "Elevation": selected.get("elevation"),
            "Timezone": selected.get("timezone"),
            "Matched_Name": selected.get("name"),
            "Admin1": selected.get("admin1")
        })

        print(
            f"  ✅ {selected.get('name')} "
            f"({selected.get('latitude')}, {selected.get('longitude')})"
        )

    except Exception as e:
        print(f"  ❌ Error: {e}")

    time.sleep(0.5)


result_df = pd.DataFrame(results)

result_df.to_csv(OUTPUT_FILE, index=False)

print("\n================================")
print("Coordinate extraction complete")
print("================================")

print(f"Districts found: {len(result_df)}")
print(f"Saved to: {OUTPUT_FILE}")

print("\nCoordinates:")
print(result_df.to_string(index=False))
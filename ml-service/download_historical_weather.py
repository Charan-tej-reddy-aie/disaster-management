import pandas as pd
import requests
import time
import os

COORD_FILE = "data/kerala_district_coordinates.csv"
OUTPUT_DIR = "data/historical_weather"

START_DATE = "1971-01-01"
END_DATE = "2023-12-31"

os.makedirs(OUTPUT_DIR, exist_ok=True)

coordinates = pd.read_csv(COORD_FILE)

print("========================================")
print("Kerala Historical Weather Download")
print("========================================")
print(f"Districts: {len(coordinates)}")
print(f"Period: {START_DATE} to {END_DATE}")
print()


for _, row in coordinates.iterrows():

    district = row["District"]
    latitude = row["Latitude"]
    longitude = row["Longitude"]

    output_file = os.path.join(
        OUTPUT_DIR,
        f"{district.lower().replace(' ', '_')}.csv"
    )

    print(f"Downloading weather for: {district}")
    print(f"Coordinates: {latitude}, {longitude}")

    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": START_DATE,
        "end_date": END_DATE,
        "daily": ",".join([
            "temperature_2m_mean",
            "temperature_2m_max",
            "temperature_2m_min",
            "relative_humidity_2m_mean",
            "precipitation_sum",
            "pressure_msl_mean",
            "wind_speed_10m_mean",
            "wind_speed_10m_max",
            "wind_direction_10m_dominant"
        ]),
        "timezone": "Asia/Kolkata"
    }

    try:

        response = requests.get(
            url,
            params=params,
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        if "daily" not in data:
            print("  ❌ No daily weather data returned")
            print()
            continue

        daily = data["daily"]

        weather_df = pd.DataFrame(daily)

        weather_df["District"] = district
        weather_df["Latitude"] = latitude
        weather_df["Longitude"] = longitude

        # Put District first
        columns = [
            "District",
            "time",
            "Latitude",
            "Longitude",
            "temperature_2m_mean",
            "temperature_2m_max",
            "temperature_2m_min",
            "relative_humidity_2m_mean",
            "precipitation_sum",
            "pressure_msl_mean",
            "wind_speed_10m_mean",
            "wind_speed_10m_max",
            "wind_direction_10m_dominant"
        ]

        weather_df = weather_df[columns]

        weather_df.to_csv(
            output_file,
            index=False
        )

        print(f"  ✅ Saved: {output_file}")
        print(f"  Rows: {len(weather_df)}")

    except Exception as e:

        print(f"  ❌ Error downloading {district}")
        print(f"     {e}")

    print()

    # Avoid sending requests too quickly
    time.sleep(2)


print("========================================")
print("Download completed")
print("========================================")

print("\nFiles created:")

for file in os.listdir(OUTPUT_DIR):
    print(" -", file)
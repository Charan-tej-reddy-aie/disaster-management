import pandas as pd
import requests
import time
import os


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_master.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_geocoded.csv"
)

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(value):
    if pd.isna(value):
        return ""

    return (
        str(value)
        .strip()
        .lower()
    )


# ============================================================
# GEOCODING
# ============================================================

def geocode_district(district, state):

    queries = [
        f"{district}, {state}",
        district
    ]

    for query in queries:

        try:

            response = requests.get(
                GEOCODING_URL,
                params={
                    "name": query,
                    "count": 10,
                    "language": "en",
                    "countryCode": "IN",
                    "format": "json"
                },
                timeout=30
            )

            response.raise_for_status()

            data = response.json()

            if not data.get("results"):
                continue

            results = data["results"]

            district_norm = normalize_text(district)
            state_norm = normalize_text(state)

            best_result = None
            best_score = -1

            for result in results:

                result_name = normalize_text(
                    result.get("name")
                )

                result_admin1 = normalize_text(
                    result.get("admin1")
                )

                result_admin2 = normalize_text(
                    result.get("admin2")
                )

                score = 0

                # Exact district name
                if result_name == district_norm:
                    score += 5

                # District name contained in result
                if (
                    district_norm
                    and district_norm in result_name
                ):
                    score += 2

                # State match
                if (
                    state_norm
                    and state_norm in result_admin1
                ):
                    score += 5

                if (
                    state_norm
                    and state_norm in result_admin2
                ):
                    score += 3

                # India confirmation
                if result.get("country_code") == "IN":
                    score += 2

                if score > best_score:

                    best_score = score
                    best_result = result

            if best_result:

                return {
                    "latitude": best_result.get("latitude"),
                    "longitude": best_result.get("longitude"),
                    "geocoded_name": best_result.get("name"),
                    "geocoded_admin1": best_result.get("admin1"),
                    "geocoded_admin2": best_result.get("admin2"),
                    "geocoded_country": best_result.get("country"),
                    "geocoding_score": best_score,
                    "geocoding_query": query,
                    "geocoding_status": "FOUND"
                }

        except Exception as e:

            print(
                f"ERROR: {district}, {state} -> {e}"
            )

    return {
        "latitude": None,
        "longitude": None,
        "geocoded_name": None,
        "geocoded_admin1": None,
        "geocoded_admin2": None,
        "geocoded_country": None,
        "geocoding_score": 0,
        "geocoding_query": None,
        "geocoding_status": "NOT_FOUND"
    }


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("INDIA DISTRICT GEOCODING")
    print("=" * 70)

    # --------------------------------------------------------
    # LOAD MASTER
    # --------------------------------------------------------

    df = pd.read_csv(INPUT_FILE)

    print(
        f"Input districts: {len(df)}"
    )

    print()

    # --------------------------------------------------------
    # VALIDATE REQUIRED COLUMNS
    # --------------------------------------------------------

    required_columns = [
        "state_name",
        "district_name",
        "latitude",
        "longitude",
        "state_normalized",
        "district_normalized"
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        print(
            "ERROR: Missing columns:"
        )

        for column in missing_columns:
            print(
                f"  - {column}"
            )

        return

    # --------------------------------------------------------
    # GEOCODE
    # --------------------------------------------------------

    results = []

    for index, row in df.iterrows():

        state = row["state_name"]
        district = row["district_name"]

        print(
            f"[{index + 1}/{len(df)}] "
            f"{district}, {state}"
        )

        result = geocode_district(
            district,
            state
        )

        results.append({

            "district_master_id":
                row["district_master_id"],

            "state_name":
                state,

            "district_name":
                district,

            "state_normalized":
                row["state_normalized"],

            "district_normalized":
                row["district_normalized"],

            # Original coordinates
            "source_latitude":
                row["latitude"],

            "source_longitude":
                row["longitude"],

            # Open-Meteo coordinates
            "latitude":
                result["latitude"],

            "longitude":
                result["longitude"],

            "geocoded_name":
                result["geocoded_name"],

            "geocoded_admin1":
                result["geocoded_admin1"],

            "geocoded_admin2":
                result["geocoded_admin2"],

            "geocoded_country":
                result["geocoded_country"],

            "geocoding_score":
                result["geocoding_score"],

            "geocoding_query":
                result["geocoding_query"],

            "geocoding_status":
                result["geocoding_status"]
        })

        # Small delay to avoid hammering API
        time.sleep(0.2)

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    result_df = pd.DataFrame(results)

    os.makedirs(
        os.path.dirname(OUTPUT_FILE),
        exist_ok=True
    )

    result_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("GEOCODING SUMMARY")
    print("=" * 70)

    print(
        result_df[
            "geocoding_status"
        ].value_counts(
            dropna=False
        )
    )

    print()

    found = (
        result_df["geocoding_status"]
        == "FOUND"
    ).sum()

    not_found = (
        result_df["geocoding_status"]
        == "NOT_FOUND"
    ).sum()

    print(
        f"Found:     {found}"
    )

    print(
        f"Not found: {not_found}"
    )

    print()

    print(
        f"Saved: {OUTPUT_FILE}"
    )

    print()
    print("=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == "__main__":
    main()
import pandas as pd
import os
import re


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ORIGINAL_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_geocoded.csv"
)

RETRY_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_geocoding_retry.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_coordinates_final.csv"
)

REVIEW_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_coordinates_review.csv"
)


# ============================================================
# STATE NORMALIZATION
# ============================================================

def normalize_state(value):

    if pd.isna(value):
        return ""

    value = str(value).strip().lower()

    replacements = {
        "national capital territory of delhi": "delhi",
        "nct of delhi": "delhi",
        "jammu & kashmir": "jammu and kashmir",
        "jammu & kashmir": "jammu and kashmir",
        "pondicherry": "puducherry",
    }

    return replacements.get(value, value)


# ============================================================
# DISTRICT NORMALIZATION
# ============================================================

def normalize_district(value):

    if pd.isna(value):
        return ""

    value = str(value).strip().lower()

    value = re.sub(
        r"[^a-z0-9]+",
        " ",
        value
    )

    return re.sub(
        r"\s+",
        " ",
        value
    ).strip()


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("CREATING FINAL INDIA DISTRICT COORDINATE MASTER")
    print("=" * 70)

    original = pd.read_csv(
        ORIGINAL_FILE
    )

    retry = pd.read_csv(
        RETRY_FILE
    )

    print(
        f"Original records: {len(original)}"
    )

    print(
        f"Retry records:    {len(retry)}"
    )

    # --------------------------------------------------------
    # REMOVE NON-DISTRICTS
    # --------------------------------------------------------

    invalid_names = {
        "unknown",
        "others",
        "bsf camp",
        "railway quarantine"
    }

    original = original[
        ~original["district_name"]
        .str.strip()
        .str.lower()
        .isin(invalid_names)
    ].copy()

    retry = retry[
        ~retry["district_name"]
        .str.strip()
        .str.lower()
        .isin(invalid_names)
    ].copy()

    # --------------------------------------------------------
    # ORIGINAL SUCCESSFUL RECORDS
    # --------------------------------------------------------

    original_found = original[
        original["geocoding_status"] == "FOUND"
    ].copy()

    # --------------------------------------------------------
    # RETRY SUCCESSFUL RECORDS
    # --------------------------------------------------------

    retry_found = retry[
        retry["geocoding_status"] == "FOUND_RETRY"
    ].copy()

    # --------------------------------------------------------
    # CHECK RETRY STATE MATCH
    # --------------------------------------------------------

    retry_found["requested_state"] = (
        retry_found["state_name"]
        .apply(normalize_state)
    )

    retry_found["returned_state"] = (
        retry_found["geocoded_admin1"]
        .apply(normalize_state)
    )

    # Some Open-Meteo results have no admin1.
    # These require manual review rather than automatic acceptance.

    retry_found["state_match"] = (
        retry_found["returned_state"]
        == retry_found["requested_state"]
    )

    # --------------------------------------------------------
    # ACCEPT ONLY STATE-MATCHED RETRIES
    # --------------------------------------------------------

    retry_valid = retry_found[
        retry_found["state_match"]
    ].copy()

    retry_review = retry_found[
        ~retry_found["state_match"]
    ].copy()

    print()
    print(
        f"Retry accepted: {len(retry_valid)}"
    )

    print(
        f"Retry requires review: {len(retry_review)}"
    )

    # --------------------------------------------------------
    # CONVERT ORIGINAL RESULTS
    # --------------------------------------------------------

    original_final = pd.DataFrame({

        "state_name":
            original_found["state_name"],

        "district_name":
            original_found["district_name"],

        "latitude":
            original_found["latitude"],

        "longitude":
            original_found["longitude"],

        "geocoded_name":
            original_found["geocoded_name"],

        "geocoded_admin1":
            original_found["geocoded_admin1"],

        "geocoded_admin2":
            original_found["geocoded_admin2"],

        "coordinate_source":
            "open_meteo_initial",

        "coordinate_status":
            "VALID_INITIAL"

    })

    # --------------------------------------------------------
    # CONVERT RETRY RESULTS
    # --------------------------------------------------------

    retry_final = pd.DataFrame({

        "state_name":
            retry_valid["state_name"],

        "district_name":
            retry_valid["district_name"],

        "latitude":
            retry_valid["latitude"],

        "longitude":
            retry_valid["longitude"],

        "geocoded_name":
            retry_valid["geocoded_name"],

        "geocoded_admin1":
            retry_valid["geocoded_admin1"],

        "geocoded_admin2":
            retry_valid["geocoded_admin2"],

        "coordinate_source":
            "open_meteo_retry",

        "coordinate_status":
            "VALID_RETRY"

    })

    # --------------------------------------------------------
    # COMBINE
    # --------------------------------------------------------

    final_df = pd.concat(
        [
            original_final,
            retry_final
        ],
        ignore_index=True
    )

    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    final_df["state_key"] = (
        final_df["state_name"]
        .apply(normalize_state)
    )

    final_df["district_key"] = (
        final_df["district_name"]
        .apply(normalize_district)
    )

    final_df = final_df.drop_duplicates(
        subset=[
            "state_key",
            "district_key"
        ],
        keep="first"
    )

    # --------------------------------------------------------
    # REMOVE INVALID COORDINATES
    # --------------------------------------------------------

    final_df = final_df[
        final_df["latitude"].notna()
        &
        final_df["longitude"].notna()
    ].copy()

    # Basic India coordinate sanity check

    final_df = final_df[
        final_df["latitude"].between(
            6,
            38
        )
        &
        final_df["longitude"].between(
            68,
            98
        )
    ].copy()

    # --------------------------------------------------------
    # SAVE FINAL
    # --------------------------------------------------------

    final_df = final_df[
        [
            "state_name",
            "district_name",
            "latitude",
            "longitude",
            "geocoded_name",
            "geocoded_admin1",
            "geocoded_admin2",
            "coordinate_source",
            "coordinate_status"
        ]
    ]

    final_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # --------------------------------------------------------
    # SAVE REVIEW FILE
    # --------------------------------------------------------

    retry_review.to_csv(
        REVIEW_FILE,
        index=False
    )

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("FINAL COORDINATE SUMMARY")
    print("=" * 70)

    print(
        f"Final usable districts: "
        f"{len(final_df)}"
    )

    print(
        f"Wrong-state/manual review: "
        f"{len(retry_review)}"
    )

    print()

    print(
        f"Saved final master:"
    )

    print(
        OUTPUT_FILE
    )

    print()

    print(
        f"Saved review file:"
    )

    print(
        REVIEW_FILE
    )

    print()
    print("=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == "__main__":
    main()
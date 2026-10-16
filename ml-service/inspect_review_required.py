import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

INPUT_FILE = DATA_DIR / "india_flood_unmatched_review.csv"

df = pd.read_csv(INPUT_FILE)

review = df[
    df["review_category"] == "REVIEW_REQUIRED"
].copy()

print("=" * 70)
print("REVIEW REQUIRED DISTRICTS")
print("=" * 70)

print("\nTotal review-required combinations:", len(review))

print("\n" + "=" * 70)
print("ALL REVIEW-REQUIRED COMBINATIONS")
print("=" * 70)

print(
    review[
        [
            "District",
            "State",
            "match_status"
        ]
    ].to_string(index=False)
)

print("\n" + "=" * 70)
print("STATE-WISE COUNT")
print("=" * 70)

print(
    review["State"]
    .value_counts()
    .to_string()
)

print("\n" + "=" * 70)
print("DISTRICT-WISE COUNT")
print("=" * 70)

print(
    review["District"]
    .value_counts()
    .to_string()
)
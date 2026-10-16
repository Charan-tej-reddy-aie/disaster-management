from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]

FILE = BASE_DIR / "data/final/disaster_ml_dataset.csv"

print("=" * 70)
print("FINAL ML DATASET")
print("=" * 70)

df = pd.read_csv(FILE)

print(f"\nRows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

print("\n" + "=" * 70)
print("CLASS DISTRIBUTION")
print("=" * 70)

print(
    df["disaster_label"]
    .value_counts()
    .to_string()
)

print("\n" + "=" * 70)
print("CLASS PERCENTAGE")
print("=" * 70)

print(
    (
        df["disaster_label"]
        .value_counts(normalize=True)
        * 100
    ).round(3).to_string()
)

print("\n" + "=" * 70)
print("SAMPLE")
print("=" * 70)

print(
    df.head(10).to_string()
)

print("\n" + "=" * 70)
print("MISSING VALUES")
print("=" * 70)

missing = df.isna().sum()

print(
    missing[missing > 0]
    .sort_values(ascending=False)
    .head(20)
    .to_string()
)
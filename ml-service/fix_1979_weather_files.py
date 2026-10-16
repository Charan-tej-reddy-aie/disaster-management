import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

WEATHER_DIR = os.path.join(
    BASE_DIR,
    "data",
    "historical_weather_india_batched"
)

fixed = 0
skipped = 0
errors = 0

print("=" * 70)
print("FIXING 1979 WEATHER FILES")
print("=" * 70)

files = [
    f for f in os.listdir(WEATHER_DIR)
    if f.endswith(".csv") and f.endswith("_1979.csv")
]

print(f"\n1979 files found: {len(files)}")

for filename in sorted(files):

    filepath = os.path.join(
        WEATHER_DIR,
        filename
    )

    try:

        df = pd.read_csv(filepath)

        # Already standardized
        if "download_year" in df.columns:

            skipped += 1
            continue

        # Old format
        if "year" in df.columns:

            df = df.rename(
                columns={
                    "year": "download_year"
                }
            )

            df.to_csv(
                filepath,
                index=False
            )

            fixed += 1

            print(
                f"FIXED: {filename}"
            )

        else:

            print(
                f"ERROR: {filename} "
                f"has neither year nor download_year"
            )

            errors += 1

    except Exception as e:

        print(
            f"ERROR: {filename} -> {e}"
        )

        errors += 1


print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

print(
    f"Files found:   {len(files)}"
)

print(
    f"Files fixed:   {fixed}"
)

print(
    f"Already fixed: {skipped}"
)

print(
    f"Errors:        {errors}"
)

print("\nDone.")
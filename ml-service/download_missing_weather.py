import pandas as pd
import glob
import os

INPUT_PATTERN = "data/historical_weather/thiruvananthapuram_*.csv"
OUTPUT_FILE = "data/historical_weather/thiruvananthapuram.csv"

files = sorted(glob.glob(INPUT_PATTERN))

print("========================================")
print("Merging Thiruvananthapuram Weather")
print("========================================")

# Exclude the final merged file if it already exists
files = [
    f for f in files
    if os.path.basename(f) != "thiruvananthapuram.csv"
]

print(f"Files to merge: {len(files)}")

dataframes = []

for file in files:
    print(f"Reading: {file}")

    df = pd.read_csv(file)

    print(f"  Rows: {len(df)}")

    dataframes.append(df)

weather_df = pd.concat(
    dataframes,
    ignore_index=True
)

# Remove duplicate dates if any
weather_df = weather_df.drop_duplicates(
    subset=["time"]
)

# Sort chronologically
weather_df = weather_df.sort_values(
    "time"
).reset_index(drop=True)

weather_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n========================================")
print("Merge completed")
print("========================================")
print(f"Output: {OUTPUT_FILE}")
print(f"Rows: {len(weather_df)}")
print(f"Columns: {len(weather_df.columns)}")
print(f"First date: {weather_df['time'].min()}")
print(f"Last date: {weather_df['time'].max()}")

print("\nMissing values:")
print(weather_df.isnull().sum())
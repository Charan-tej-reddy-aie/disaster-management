from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]

file_path = BASE_DIR / "data" / "disasters" / "emdat.xlsx"

print("=" * 70)
print("EM-DAT DATASET INSPECTION")
print("=" * 70)

if not file_path.exists():
    print(f"\nERROR: File not found:")
    print(file_path)
    print("\nMake sure the EM-DAT file is named:")
    print("emdat.xlsx")
    raise SystemExit(1)

print(f"\nFile:")
print(file_path)

# Read Excel
df = pd.read_excel(file_path)

print("\n" + "=" * 70)
print("BASIC INFORMATION")
print("=" * 70)

print(f"Rows    : {len(df):,}")
print(f"Columns : {len(df.columns)}")

print("\n" + "=" * 70)
print("COLUMN NAMES")
print("=" * 70)

for i, column in enumerate(df.columns, start=1):
    print(f"{i:3}. {column}")

print("\n" + "=" * 70)
print("FIRST 5 ROWS")
print("=" * 70)

print(df.head().to_string())

print("\n" + "=" * 70)
print("DATA TYPES")
print("=" * 70)

print(df.dtypes.to_string())

print("\n" + "=" * 70)
print("MISSING VALUES")
print("=" * 70)

missing = df.isnull().sum()

for column, count in missing.items():
    if count > 0:
        percentage = count / len(df) * 100
        print(f"{column}: {count:,} ({percentage:.2f}%)")

print("\n" + "=" * 70)
print("DATASET INSPECTION COMPLETE")
print("=" * 70)
import pandas as pd

file_path = "data/flood_risk_dataset_india.csv"

df = pd.read_csv(file_path)

print("\n===== DATASET SHAPE =====")
print(df.shape)

print("\n===== COLUMNS =====")
for column in df.columns:
    print(column)

print("\n===== FIRST 5 ROWS =====")
print(df.head())

print("\n===== DATA TYPES =====")
print(df.dtypes)

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== TARGET DISTRIBUTION =====")
print(df["Flood Occurred"].value_counts())

print("\n===== STATISTICS =====")
print(df.describe())
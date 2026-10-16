import pandas as pd


INPUT_FILE = "data/kerala_flood_event_districts.csv"
OUTPUT_FILE = "data/kerala_flood_event_districts_clean.csv"


# ============================================================
# OFFICIAL KERALA DISTRICT NAMES
# ============================================================

VALID_DISTRICTS = [
    "Alappuzha",
    "Ernakulam",
    "Idukki",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad"
]


# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(INPUT_FILE)

print("Original rows:", len(df))


# ============================================================
# CLEAN DISTRICT TEXT
# ============================================================

df["District"] = (
    df["District"]
    .astype(str)
    .str.strip()
)


# ============================================================
# MAP KNOWN ALIASES
# ============================================================

DISTRICT_ALIASES = {

    "Kochi":
        "Ernakulam",

    "Ernākulam":
        "Ernakulam",

    "Kāsaragod":
        "Kasaragod",

    "Pathanāmthitta":
        "Pathanamthitta"
}


df["District"] = df["District"].replace(
    DISTRICT_ALIASES
)


# ============================================================
# KEEP ONLY VALID DISTRICTS
# ============================================================

clean_df = df[
    df["District"].isin(VALID_DISTRICTS)
].copy()


# ============================================================
# REPORT REMOVED VALUES
# ============================================================

removed = df[
    ~df["District"].isin(VALID_DISTRICTS)
]["District"].value_counts()


print("\n========================================")
print("REMOVED INVALID DISTRICT VALUES")
print("========================================")

if len(removed) == 0:
    print("None")
else:
    print(removed.to_string())


# ============================================================
# REMOVE DUPLICATES
# ============================================================

clean_df = clean_df.drop_duplicates(
    subset=["UEI", "District"]
)


# ============================================================
# SAVE
# ============================================================

clean_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n========================================")
print("CLEAN DATASET")
print("========================================")

print(
    "Final rows:",
    len(clean_df)
)

print(
    "Unique events:",
    clean_df["UEI"].nunique()
)

print(
    "Unique districts:",
    clean_df["District"].nunique()
)

print("\nDistrict counts:")

print(
    clean_df["District"]
    .value_counts()
    .to_string()
)

print(
    "\nSaved to:",
    OUTPUT_FILE
)
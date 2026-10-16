import pandas as pd
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

INPUT_FILE = DATA_DIR / "india_flood_district_mapping.csv"
OUTPUT_FILE = DATA_DIR / "india_flood_district_mapping_resolved.csv"
REVIEW_FILE = DATA_DIR / "india_flood_districts_remaining_review.csv"


print("=" * 70)
print("RESOLVING INDIA FLOOD DISTRICT NAMES")
print("=" * 70)


df = pd.read_csv(INPUT_FILE)


# ---------------------------------------------------------
# Normalize text
# ---------------------------------------------------------

def norm(value):
    if pd.isna(value):
        return ""

    value = str(value).lower().strip()
    value = value.replace("&", "and")

    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value.strip()


df["district_norm"] = df["District"].apply(norm)
df["state_norm"] = df["State"].apply(norm)


# ---------------------------------------------------------
# IMPORTANT:
# Keep all already matched rows unchanged
# ---------------------------------------------------------

df["canonical_district"] = df["district_name"]
df["canonical_state"] = df["state_name"]

df["resolution"] = "ALREADY_MATCHED"


# ---------------------------------------------------------
# Only process rows that failed the original match
# ---------------------------------------------------------

unmatched_mask = (
    df["match_status"] != "MATCHED"
)


# ---------------------------------------------------------
# High-confidence aliases
# ---------------------------------------------------------

ALIASES = {

    # Andhra Pradesh
    ("ananthapuramuamu", "andhra pradesh"):
        ("Anantapur", "Andhra Pradesh"),

    ("dakshina kannada", "andhra pradesh"):
        ("Dakshina Kannada", "Karnataka"),

    ("ntr", "andhra pradesh"):
        ("NTR", "Andhra Pradesh"),

    ("palnadu", "andhra pradesh"):
        ("Palnadu", "Andhra Pradesh"),

    ("sri potti sriramulu nellore", "andhra pradesh"):
        ("Nellore", "Andhra Pradesh"),

    ("y s r", "andhra pradesh"):
        ("Y.S.R. Kadapa", "Andhra Pradesh"),

    # Arunachal Pradesh
    ("dibang valley", "arunachal pradesh"):
        ("Dibang Valley", "Arunachal Pradesh"),

    ("itanagar", "arunachal pradesh"):
        ("Papum Pare", "Arunachal Pradesh"),

    ("leparada", "arunachal pradesh"):
        ("Lepa Rada", "Arunachal Pradesh"),

    # Assam
    ("kamrup metro", "assam"):
        ("Kamrup Metropolitan", "Assam"),

    ("mancachar", "assam"):
        ("South Salmara Mancachar", "Assam"),

    ("south salmara mancachar", "assam"):
        ("South Salmara Mancachar", "Assam"),

    ("marigaon", "assam"):
        ("Morigaon", "Assam"),

    # Bihar
    ("kaimur bhabua", "bihar"):
        ("Kaimur", "Bihar"),

    ("pashchim champaran", "bihar"):
        ("West Champaran", "Bihar"),

    ("purbi champaran", "bihar"):
        ("East Champaran", "Bihar"),

    # Gujarat
    ("arvalli", "gujarat"):
        ("Aravalli", "Gujarat"),

    ("banas kantha", "gujarat"):
        ("Banaskantha", "Gujarat"),

    ("chota udaipur", "gujarat"):
        ("Chhota Udaipur", "Gujarat"),

    ("dangs", "gujarat"):
        ("Dang", "Gujarat"),

    ("the dangs", "gujarat"):
        ("Dang", "Gujarat"),

    ("devbhumi dwarka dwarka", "gujarat"):
        ("Devbhumi Dwarka", "Gujarat"),

    ("kachchh", "gujarat"):
        ("Kachchh", "Gujarat"),

    ("mahesana", "gujarat"):
        ("Mehsana", "Gujarat"),

    ("panch mahals", "gujarat"):
        ("Panchmahal", "Gujarat"),

    ("sabar kantha", "gujarat"):
        ("Sabarkantha", "Gujarat"),

    # Haryana
    ("charki dadri", "haryana"):
        ("Charkhi Dadri", "Haryana"),

    # Himachal Pradesh
    ("lahul and spiti", "himachal pradesh"):
        ("Lahaul and Spiti", "Himachal Pradesh"),

    # Jammu / Kashmir
    ("poonch", "jammu and kashmir"):
        ("Poonch", "Jammu and Kashmir"),

    ("shopian", "jammu and kashmir"):
        ("Shopian", "Jammu and Kashmir"),

    ("kargil", "jammu and kashmir"):
        ("Kargil", "Ladakh"),

    ("leh ladakh", "jammu and kashmir"):
        ("Leh", "Ladakh"),

    # Karnataka
    ("bagalkotee", "karnataka"):
        ("Bagalkot", "Karnataka"),

    ("beedar", "karnataka"):
        ("Bidar", "Karnataka"),

    ("bijapur", "karnataka"):
        ("Vijayapura", "Karnataka"),

    ("chamarajanagaraa", "karnataka"):
        ("Chamarajanagar", "Karnataka"),

    ("davangere", "karnataka"):
        ("Davanagere", "Karnataka"),

    ("mangalore", "karnataka"):
        ("Dakshina Kannada", "Karnataka"),

    ("uttar kashia kannada", "karnataka"):
        ("Uttara Kannada", "Karnataka"),

    # Kerala
    ("malikkeri", "kerala"):
        ("Malappuram", "Kerala"),

    # Madhya Pradesh
    ("khargone khargone west nimar", "madhya pradesh"):
        ("Khargone", "Madhya Pradesh"),

    ("narmadapuram", "madhya pradesh"):
        ("Narmadapuram", "Madhya Pradesh"),

    # Maharashtra
    ("dharashiv", "maharashtra"):
        ("Dharashiv", "Maharashtra"),

    ("mumbai colaba", "maharashtra"):
        ("Mumbai", "Maharashtra"),

    # Meghalaya
    ("ri bhoi", "meghalaya"):
        ("Ri Bhoi", "Meghalaya"),

    # Odisha
    ("anugul", "odisha"):
        ("Angul", "Odisha"),

    ("baleshwar", "odisha"):
        ("Balasore", "Odisha"),

    ("bhubaneshwar", "odisha"):
        ("Khordha", "Odisha"),

    ("jagatsinghapur", "odisha"):
        ("Jagatsinghpur", "Odisha"),

    ("jajapur", "odisha"):
        ("Jajpur", "Odisha"),

    # Puducherry
    ("pondicherry", "puducherry"):
        ("Puducherry", "Puducherry"),

    # Punjab
    ("shahid bhagat singh nagar", "punjab"):
        ("Shaheed Bhagat Singh Nagar", "Punjab"),

    ("sri sri muktsar sahib sahib", "punjab"):
        ("Sri Muktsar Sahib", "Punjab"),

    # Sikkim
    ("gangtok", "sikkim"):
        ("Gangtok", "Sikkim"),

    ("gyalshing", "sikkim"):
        ("Gyalshing", "Sikkim"),

    ("mangan", "sikkim"):
        ("Mangan", "Sikkim"),

    ("namchi", "sikkim"):
        ("Namchi", "Sikkim"),

    # Tamil Nadu
    ("kanniyakumari", "tamil nadu"):
        ("Kanniyakumari", "Tamil Nadu"),

    ("kanniyakumariumari", "tamil nadu"):
        ("Kanniyakumari", "Tamil Nadu"),

    ("nagarkoil", "tamil nadu"):
        ("Kanniyakumari", "Tamil Nadu"),

    ("karaikal", "tamil nadu"):
        ("Karaikal", "Puducherry"),

    ("the nilgiris", "tamil nadu"):
        ("Nilgiris", "Tamil Nadu"),

    # Telangana
    ("warangal", "telangana"):
        ("Warangal", "Telangana"),

    # Tripura
    ("sepahijala", "tripura"):
        ("Sepahijala", "Tripura"),

    ("unakoti", "tripura"):
        ("Unakoti", "Tripura"),

    # Uttar Pradesh
    ("bara banki", "uttar pradesh"):
        ("Barabanki", "Uttar Pradesh"),

    ("ghazipurr", "uttar pradesh"):
        ("Ghazipur", "Uttar Pradesh"),

    ("kanpur nagar dehat", "uttar pradesh"):
        ("Kanpur Dehat", "Uttar Pradesh"),

    ("kanpur nagar nagar", "uttar pradesh"):
        ("Kanpur Nagar", "Uttar Pradesh"),

    ("kheri", "uttar pradesh"):
        ("Kheri", "Uttar Pradesh"),

    ("lakhimpur", "uttar pradesh"):
        ("Lakhimpur Kheri", "Uttar Pradesh"),

    ("mahrajganj", "uttar pradesh"):
        ("Maharajganj", "Uttar Pradesh"),

    ("sshravasti", "uttar pradesh"):
        ("Shravasti", "Uttar Pradesh"),

    ("shrawasti", "uttar pradesh"):
        ("Shravasti", "Uttar Pradesh"),

    ("siddharthnagar", "uttar pradesh"):
        ("Siddharthnagar", "Uttar Pradesh"),

    # Uttarakhand
    ("rudra prayag", "uttarakhand"):
        ("Rudraprayag", "Uttarakhand"),

    ("udam singh nagar", "uttarakhand"):
        ("Udham Singh Nagar", "Uttarakhand"),

    # West Bengal
    ("darjeelingm", "west bengal"):
        ("Darjeeling", "West Bengal"),

    ("maldah", "west bengal"):
        ("Malda", "West Bengal"),

    ("siliguri", "west bengal"):
        ("Darjeeling", "West Bengal"),
}


# ---------------------------------------------------------
# Apply aliases ONLY to unmatched rows
# ---------------------------------------------------------

for idx, row in df[unmatched_mask].iterrows():

    key = (
        row["district_norm"],
        row["state_norm"]
    )

    if key in ALIASES:

        canonical_district, canonical_state = ALIASES[key]

        df.at[idx, "canonical_district"] = canonical_district
        df.at[idx, "canonical_state"] = canonical_state
        df.at[idx, "resolution"] = "HIGH_CONFIDENCE_ALIAS"


# ---------------------------------------------------------
# Historical Andhra Pradesh → Telangana
# ---------------------------------------------------------

historical_states = {
    "adilabad": "Adilabad",
    "hyderabad": "Hyderabad",
    "karimnagar": "Karimnagar",
    "khammam": "Khammam",
    "mahabubnagar": "Mahbubnagar",
    "medak": "Medak",
    "nalgonda": "Nalgonda",
    "nizamabad": "Nizamabad",
    "ranga reddy": "Rangareddy",
    "warangal": "Warangal",
}


for idx, row in df[unmatched_mask].iterrows():

    if (
        row["resolution"] == "ALREADY_MATCHED"
        and row["state_norm"] == "andhra pradesh"
        and row["district_norm"] in historical_states
    ):

        df.at[idx, "canonical_district"] = (
            historical_states[row["district_norm"]]
        )

        df.at[idx, "canonical_state"] = "Telangana"

        df.at[idx, "resolution"] = (
            "HISTORICAL_STATE_CHANGE"
        )


# ---------------------------------------------------------
# Regional / non-district locations
# ---------------------------------------------------------

non_district_terms = {
    "east",
    "central",
    "north",
    "north east",
    "north west",
    "south",
    "south east",
    "south west",
    "west",
    "north bengal",
    "garhwal",
    "kashmir",
    "marathwada",
    "neighbourhood",
    "east west godavari",
    "east west singhbhum",
    "purbi west singhbhum",
    "east west purba purba medinipur",
    "several other district andhra pradesh",
}


for idx, row in df[unmatched_mask].iterrows():

    if row["resolution"] != "ALREADY_MATCHED":
        continue

    if row["district_norm"] in non_district_terms:

        df.at[idx, "resolution"] = "REGIONAL_NOT_DISTRICT"


# ---------------------------------------------------------
# Multi-state records remain unresolved
# ---------------------------------------------------------

multi_state_mask = (
    unmatched_mask
    &
    df["State"].astype(str).str.contains(",", na=False)
    &
    (df["resolution"] == "ALREADY_MATCHED")
)

df.loc[
    multi_state_mask,
    "resolution"
] = "MULTI_STATE_UNRESOLVED"


# ---------------------------------------------------------
# Remaining unmatched records
# ---------------------------------------------------------

remaining_mask = (
    unmatched_mask
    &
    (df["resolution"] == "ALREADY_MATCHED")
)

df.loc[
    remaining_mask,
    "resolution"
] = "REVIEW_REQUIRED"


# ---------------------------------------------------------
# Validate aliases against district master
# ---------------------------------------------------------

master = pd.read_csv(
    DATA_DIR / "india_district_master.csv"
)

master_pairs = set(
    zip(
        master["state_normalized"],
        master["district_normalized"]
    )
)


def canonical_exists(row):

    if pd.isna(row["canonical_district"]):
        return False

    state = norm(row["canonical_state"])
    district = norm(row["canonical_district"])

    return (state, district) in master_pairs


df["canonical_exists_in_master"] = df.apply(
    canonical_exists,
    axis=1
)


# ---------------------------------------------------------
# Flag invalid resolved aliases
# ---------------------------------------------------------

invalid_resolution = (
    df["resolution"].isin([
        "HIGH_CONFIDENCE_ALIAS",
        "HISTORICAL_STATE_CHANGE"
    ])
    &
    (~df["canonical_exists_in_master"])
)

df.loc[
    invalid_resolution,
    "resolution"
] = "REVIEW_REQUIRED"


# ---------------------------------------------------------
# Save full result
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# Save remaining review
# ---------------------------------------------------------

remaining = df[
    df["resolution"] == "REVIEW_REQUIRED"
].copy()

remaining.to_csv(
    REVIEW_FILE,
    index=False
)


# ---------------------------------------------------------
# Results
# ---------------------------------------------------------

print("\n" + "=" * 70)
print("RESOLUTION RESULTS")
print("=" * 70)

print(
    df["resolution"]
    .value_counts()
    .to_string()
)

print("\nTotal event-district rows:", len(df))

print(
    "Already matched:",
    (
        df["resolution"] == "ALREADY_MATCHED"
    ).sum()
)

print(
    "Resolved aliases:",
    (
        df["resolution"] == "HIGH_CONFIDENCE_ALIAS"
    ).sum()
)

print(
    "Historical state changes:",
    (
        df["resolution"] == "HISTORICAL_STATE_CHANGE"
    ).sum()
)

print(
    "Regional/non-district:",
    (
        df["resolution"] == "REGIONAL_NOT_DISTRICT"
    ).sum()
)

print(
    "Multi-state unresolved:",
    (
        df["resolution"] == "MULTI_STATE_UNRESOLVED"
    ).sum()
)

print(
    "Still requiring review:",
    (
        df["resolution"] == "REVIEW_REQUIRED"
    ).sum()
)

print(
    "\nCanonical mappings not found in district master:",
    (~df["canonical_exists_in_master"]).sum()
)

print("\nSaved resolved mapping:")
print(OUTPUT_FILE)

print("\nSaved remaining review:")
print(REVIEW_FILE)

print("\nDONE")
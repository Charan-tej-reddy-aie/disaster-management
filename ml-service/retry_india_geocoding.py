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
    "india_district_geocoded.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "data",
    "india_district_geocoding_retry.csv"
)

GEOCODING_URL = (
    "https://geocoding-api.open-meteo.com/v1/search"
)


# ============================================================
# DISTRICT NAME ALIASES
# ============================================================

ALIASES = {

    # Andhra Pradesh
    "East Godavari": "Kakinada",
    "Prakasam": "Ongole",
    "Y.S.R. Kadapa": "Kadapa",

    # Arunachal Pradesh
    "Papum Pare": "Itanagar",
    "East Kameng": "Seppa",
    "West Kameng": "Bomdila",
    "East Siang": "Pasighat",
    "West Siang": "Aalo",
    "Lower Subansiri": "Ziro",
    "Upper Subansiri": "Daporijo",
    "Lower Siang": "Likabali",
    "Upper Siang": "Yingkiong",
    "Lower Dibang Valley": "Roing",
    "Upper Dibang Valley": "Anini",
    "Anjaw": "Hawai",
    "Kra Daadi": "Palin",
    "Kurung Kumey": "Koloriang",
    "Lepa Rada": "Basar",
    "Pakke Kessang": "Lemmi",

    # Assam
    "Cachar": "Silchar",
    "Charaideo": "Sonari",
    "Dima Hasao": "Haflong",
    "Kamrup": "Amingaon",
    "Kamrup Metropolitan": "Guwahati",
    "Karbi Anglong": "Diphu",
    "Sivasagar": "Sivasagar",
    "South Salmara Mankachar": "Hatsingimari",
    "West Karbi Anglong": "Hamren",

    # Bihar
    "East Champaran": "Motihari",
    "West Champaran": "Bettiah",
    "Lakhisarai": "Lakhisarai",
    "Nalanda": "Bihar Sharif",

    # Chhattisgarh
    "Janjgir Champa": "Janjgir",
    "Rajnandgaon": "Rajnandgaon",
    "Uttar Bastar Kanker": "Kanker",
    "Gaurela Pendra Marwahi": "Gaurela",

    # Delhi
    "Central Delhi": "New Delhi",
    "East Delhi": "Delhi",
    "North Delhi": "Delhi",
    "North East Delhi": "Delhi",
    "North West Delhi": "Delhi",
    "South Delhi": "Delhi",
    "South East Delhi": "Delhi",
    "South West Delhi": "Delhi",
    "West Delhi": "Delhi",

    # Goa
    "North Goa": "Panaji",
    "South Goa": "Margao",

    # Gujarat
    "Banaskantha": "Palanpur",
    "Devbhumi Dwarka": "Khambhalia",
    "Gir Somnath": "Veraval",
    "Mahisagar": "Lunawada",
    "Panchmahal": "Godhra",
    "Sabarkantha": "Himatnagar",

    # Himachal Pradesh
    "Lahaul and Spiti": "Keylong",

    # Jharkhand
    "East Singhbhum": "Jamshedpur",
    "Koderma": "Koderma",
    "Saraikela-Kharsawan": "Seraikela",
    "West Singhbhum": "Chaibasa",

    # Jammu and Kashmir
    "Bandipora": "Bandipora",
    "Baramulla": "Baramulla",
    "Budgam": "Budgam",

    # Karnataka
    "Bagalkote": "Bagalkot",
    "Bengaluru Rural": "Devanahalli",
    "Bengaluru Urban": "Bengaluru",
    "Chamarajanagara": "Chamarajanagar",
    "Chikkaballapura": "Chikkaballapur",
    "Dakshina Kannada": "Mangalore",
    "Davanagere": "Davangere",
    "Uttara Kannada": "Karwar",

    # Kerala
    "Wayanad": "Kalpetta",

    # Maharashtra
    "Buldhana": "Buldhana",
    "Mumbai Suburban": "Mumbai",
    "Raigad": "Alibag",

    # Meghalaya
    "East Garo Hills": "Williamnagar",
    "East Jaintia Hills": "Khliehriat",
    "East Khasi Hills": "Shillong",
    "North Garo Hills": "Resubelpara",
    "South Garo Hills": "Baghmara",
    "South West Garo Hills": "Ampati",
    "South West Khasi Hills": "Mawkyrwat",
    "West Garo Hills": "Tura",
    "West Jaintia Hills": "Jowai",
    "West Khasi Hills": "Nongstoin",

    # Manipur
    "Imphal East": "Porompat",
    "Imphal West": "Imphal",
    "Noney": "Noney",

    # Madhya Pradesh
    "Agar Malwa": "Agar",
    "Hoshangabad": "Narmadapuram",

    # Mizoram
    "Champhai": "Champhai",

    # Odisha
    "Boudh": "Boudh",
    "Kandhamal": "Phulbani",
    "Nabarangapur": "Nabarangpur",

    # Punjab
    "Fatehgarh Sahib": "Fatehgarh Sahib",
    "Sri Muktsar Sahib": "Muktsar",

    # Rajasthan
    "Jalore": "Jalore",

    # Sikkim
    "East Sikkim": "Gangtok",
    "North Sikkim": "Mangan",
    "South Sikkim": "Namchi",
    "West Sikkim": "Gyalshing",

    # Telangana
    "Bhadradri Kothagudem": "Kothagudem",
    "Jayashankar Bhupalapally": "Bhupalpally",
    "Jogulamba Gadwal": "Gadwal",
    "Kamareddy": "Kamareddy",
    "Mahabubabad": "Mahbubabad",
    "Mahabubnagar": "Mahbubnagar",
    "Medchal Malkajgiri": "Medchal",
    "Nagarkurnool": "Nagarkurnool",
    "Rajanna Sircilla": "Sircilla",
    "Ranga Reddy": "Hyderabad",
    "Sangareddy": "Sangareddy",
    "Warangal Rural": "Warangal",
    "Warangal Urban": "Warangal",
    "Yadadri Bhuvanagiri": "Bhongir",

    # Tamil Nadu
    "Kancheepuram": "Kanchipuram",
    "Kanyakumari": "Nagercoil",
    "Nilgiris": "Ooty",
    "Thiruvallur": "Tiruvallur",
    "Thoothukkudi": "Thoothukudi",
    "Tirupathur": "Tirupattur",
    "Viluppuram": "Villupuram",
    "Virudhunagar": "Virudhunagar",

    # Tripura
    "Gomati": "Udaipur",
    "North Tripura": "Dharmanagar",
    "South Tripura": "Belonia",
    "Unokoti": "Kailashahar",
    "West Tripura": "Agartala",

    # Uttar Pradesh
    "Ambedkar Nagar": "Akbarpur",
    "Gautam Buddha Nagar": "Noida",
    "Kanpur Dehat": "Akbarpur",
    "Kanpur Nagar": "Kanpur",
    "Kaushambi": "Manjhanpur",
    "Sant Kabir Nagar": "Khalilabad",

    # Uttarakhand
    "Pauri Garhwal": "Pauri",
    "Tehri Garhwal": "New Tehri",
    "Udham Singh Nagar": "Rudrapur",

    # West Bengal
    "Alipurduar": "Alipurduar",
    "Birbhum": "Suri",
    "Dakshin Dinajpur": "Balurghat",
    "North 24 Parganas": "Barasat",
    "Paschim Bardhaman": "Asansol",
    "Paschim Medinipur": "Midnapore",
    "Purba Bardhaman": "Bardhaman",
    "Purba Medinipur": "Tamluk",
    "South 24 Parganas": "Baruipur",
    "Uttar Dinajpur": "Raiganj",
}


# ============================================================
# GEOCODE
# ============================================================

def geocode(query):

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

        results = data.get("results", [])

        if not results:
            return None

        # Prefer India results
        india_results = [
            r for r in results
            if r.get("country_code") == "IN"
        ]

        if india_results:
            return india_results[0]

        return results[0]

    except Exception as e:

        print(
            f"  API ERROR: {query} -> {e}"
        )

        return None


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("RETRY INDIA DISTRICT GEOCODING")
    print("=" * 70)

    df = pd.read_csv(INPUT_FILE)

    failed = df[
        df["geocoding_status"] == "NOT_FOUND"
    ].copy()

    print(
        f"Original failed records: {len(failed)}"
    )

    # --------------------------------------------------------
    # REMOVE NON-GEOGRAPHIC RECORDS
    # --------------------------------------------------------

    invalid_names = {
        "Unknown",
        "Others",
        "BSF Camp",
        "Railway Quarantine"
    }

    failed = failed[
        ~failed["district_name"].isin(
            invalid_names
        )
    ].copy()

    print(
        f"After removing non-district records: "
        f"{len(failed)}"
    )

    results = []

    for index, row in failed.iterrows():

        district = row["district_name"]
        state = row["state_name"]

        print()
        print(
            f"[{len(results) + 1}/{len(failed)}] "
            f"{district}, {state}"
        )

        candidates = []

        # ----------------------------------------------------
        # Query 1: Alias + state
        # ----------------------------------------------------

        alias = ALIASES.get(
            district
        )

        if alias:

            candidates.append(
                f"{alias}, {state}"
            )

        # ----------------------------------------------------
        # Query 2: District + state
        # ----------------------------------------------------

        candidates.append(
            f"{district}, {state}"
        )

        # ----------------------------------------------------
        # Query 3: Alias only
        # ----------------------------------------------------

        if alias:

            candidates.append(alias)

        # ----------------------------------------------------
        # Query 4: District only
        # ----------------------------------------------------

        candidates.append(district)

        result = None
        used_query = None

        for query in candidates:

            result = geocode(query)

            if result:

                used_query = query
                break

            time.sleep(0.3)

        if result:

            print(
                f"  FOUND -> "
                f"{result.get('name')}, "
                f"{result.get('admin1')}"
            )

            results.append({

                "state_name": state,

                "district_name": district,

                "latitude":
                    result.get("latitude"),

                "longitude":
                    result.get("longitude"),

                "geocoded_name":
                    result.get("name"),

                "geocoded_admin1":
                    result.get("admin1"),

                "geocoded_admin2":
                    result.get("admin2"),

                "geocoded_country":
                    result.get("country"),

                "geocoding_query":
                    used_query,

                "geocoding_status":
                    "FOUND_RETRY"

            })

        else:

            print("  NOT FOUND")

            results.append({

                "state_name": state,

                "district_name": district,

                "latitude": None,

                "longitude": None,

                "geocoded_name": None,

                "geocoded_admin1": None,

                "geocoded_admin2": None,

                "geocoded_country": None,

                "geocoding_query": None,

                "geocoding_status":
                    "NOT_FOUND_RETRY"

            })

        time.sleep(0.5)

    result_df = pd.DataFrame(results)

    result_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print()
    print("=" * 70)
    print("RETRY SUMMARY")
    print("=" * 70)

    print(
        result_df[
            "geocoding_status"
        ].value_counts()
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
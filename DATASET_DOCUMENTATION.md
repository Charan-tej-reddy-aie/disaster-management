# Comprehensive Dataset Specification & Data Engineering Architecture
## Multi-Modal Disaster Prediction, Quantum Logistics, and Blockchain Auditing System

---

## 1. Executive Summary & Data Architecture

The **Intelligent Disaster Management System** incorporates a multi-tier data architecture designed to bridge historical disaster patterns, continuous meteorological telemetry, and real-time operational logistics. The system integrates:

1. **Ground-Truth Historical Disaster Catalog**: Decadal multi-disaster event records curated from the **EM-DAT International Disaster Database** for the Indian subcontinent.
2. **Atmospheric & Climate Reanalysis Grid**: Decadal daily meteorological observations extracted via **Open-Meteo (ECMWF ERA5 / ERA5-Land Reanalysis)** across Indian state and district coordinates.
3. **Engineered Spatio-Temporal Feature Pipeline**: A 23-dimensional feature space engineered using cumulative rolling windows, barometric pressure gradients, and diurnal thermal variations.
4. **Operational Relational Schema (MySQL)**: Dynamic data models managing state administrations, strategic warehouses, 10 relief resource types, multi-echelon requisition workflows, and live prediction telemetry.

```mermaid
graph TD
    A[EM-DAT Disaster Database<br/>Event Durations & Regions] --> C[Spatio-Temporal Data Harmonizer]
    B[Open-Meteo / ERA5 Reanalysis<br/>Decadal Weather Variables] --> C
    
    C --> D[Feature Engineering Engine<br/>23 Meteorological Features]
    D --> E[Class Balancing & Temporal Split<br/>70% Train | 15% Val | 15% Test]
    E --> F[Random Forest Classifier<br/>disaster_random_forest.joblib]
    
    G[Open-Meteo Live API<br/>Real-Time Telemetry] --> H[Live Inference Pipeline]
    F --> H
    H --> I[MySQL prediction_runs Table]
    I --> J[React Mission Control Dashboard]
```

---

## 2. Primary Machine Learning Datasets

### 2.1 Historical Ground-Truth: EM-DAT Database
* **Institutional Source**: Centre for Research on the Epidemiology of Disasters (CRED), UCLouvain, Brussels, Belgium ([emdat.be](https://www.emdat.be/)).
* **Geographical Filtering**: Republic of India (`ISO == "IND"`).
* **Temporal Resolution**: Multi-decadal historical archive (1980–2024).
* **Target Classification Taxonomy (7 Classes)**:
  1. **`FLOOD`**: Riverine flooding, monsoon overflow, flash floods, and coastal inundation.
  2. **`CYCLONE`**: Tropical depressions, cyclonic storms, severe cyclonic storms, and storm surges.
  3. **`HEATWAVE`**: Severe anomalous positive temperature spikes exceeding standard summer thresholds.
  4. **`DROUGHT`**: Chronic prolonged deficits in precipitation and surface moisture.
  5. **`LANDSLIDE`**: Sudden mass movement of soil/rock triggered by sustained heavy rainfall.
  6. **`WILDFIRE`**: Forest and brush fires triggered by high temperatures, low humidity, and wind.
  7. **`NORMAL`**: Baseline non-disaster atmospheric and environmental conditions.

### 2.2 Meteorological Reanalysis Grid: Open-Meteo / ERA5
* **Atmospheric Model**: European Centre for Medium-Range Weather Forecasts (ECMWF) ERA5 / ERA5-Land Reanalysis.
* **Spatial Resolution**: 0.25° grid (~25 km resolution) anchored to centroids of Indian districts and state emergency operations centers.
* **Temporal Sampling**: Daily aggregates synthesized from 24-hour hourly measurements.
* **Raw Measurements**:
  * 2-meter air temperature: Daily mean ($T_{\text{mean}}$), maximum ($T_{\text{max}}$), minimum ($T_{\text{min}}$).
  * Precipitation: Total daily precipitation accumulation ($\text{Precip}_{\text{sum}}$ in mm).
  * Relative Humidity: Daily mean relative humidity at 2m ($\text{RH}_{\text{mean}}$ in %).
  * Atmospheric Surface Pressure: Daily mean pressure ($P_{\text{mean}}$ in hPa).
  * Wind: 10-meter mean speed ($W_{\text{mean}}$ in km/h), maximum gust ($W_{\text{max}}$), and dominant direction ($\theta_{\text{wind}}$ in degrees).

---

## 3. The 23-Dimensional Feature Engineering Pipeline

Raw meteorological variables on a single day cannot adequately predict disasters that depend on antecedent soil conditions or atmospheric pressure trends. A 23-feature vector is engineered using rolling aggregations, differentials, and thermal indicators.

### 3.1 Feature Dictionary & Mathematical Formulation

| # | Feature Identifier | Physical Dimension / Unit | Mathematical Expression | Disaster Significance |
|:---|:---|:---:|:---|:---|
| 1 | `temperature_2m_mean` | °C | $\frac{1}{24}\sum_{h=1}^{24} T_h$ | Baseline thermal profile of region. |
| 2 | `temperature_2m_max` | °C | $\max_{h=1..24} (T_h)$ | Detects extreme thermal peaks (`HEATWAVE`). |
| 3 | `temperature_2m_min` | °C | $\min_{h=1..24} (T_h)$ | Nocturnal thermal cooling rate. |
| 4 | `temperature_range` | °C | $T_{\text{max}} - T_{\text{min}}$ | Diurnal temperature spread; high spread indicates dry arid air (`DROUGHT`), low spread indicates cloud cover. |
| 5 | `precipitation_sum` | mm | $\sum_{h=1}^{24} \text{Rain}_h$ | Direct single-day rainfall intensity. |
| 6 | `rainfall_1d` | mm | $\text{Precipitation on day } t$ | Immediate surface water accumulation. |
| 7 | `rainfall_3d` | mm | $\sum_{i=0}^{2} \text{Rain}_{t-i}$ | Trigger metric for urban flash floods and rapid runoff. |
| 8 | `rainfall_7d` | mm | $\sum_{i=0}^{6} \text{Rain}_{t-i}$ | Riverine basin saturation; river bank overflow trigger. |
| 9 | `rainfall_14d` | mm | $\sum_{i=0}^{13} \text{Rain}_{t-i}$ | Subsurface soil pore-water saturation; primary `LANDSLIDE` trigger. |
| 10 | `rainfall_3d_mean` | mm/day | $\frac{1}{3}\sum_{i=0}^{2} \text{Rain}_{t-i}$ | Short-term average precipitation intensity. |
| 11 | `rainfall_7d_mean` | mm/day | $\frac{1}{7}\sum_{i=0}^{6} \text{Rain}_{t-i}$ | Medium-term monsoon persistence index. |
| 12 | `relative_humidity_2m_mean` | % | $\frac{1}{24}\sum_{h=1}^{24} \text{RH}_h$ | Atmospheric moisture availability. |
| 13 | `humidity_3d_mean` | % | $\frac{1}{3}\sum_{i=0}^{2} \text{RH}_{t-i}$ | Short-term moisture retention in atmospheric boundary layer. |
| 14 | `humidity_7d_mean` | % | $\frac{1}{7}\sum_{i=0}^{6} \text{RH}_{t-i}$ | Prolonged humidity deficits identify high `WILDFIRE` and `DROUGHT` risk. |
| 15 | `surface_pressure_mean` | hPa | $\frac{1}{24}\sum_{h=1}^{24} P_h$ | Regional barometric baseline. |
| 16 | `pressure_change_1d` | hPa | $P_t - P_{t-1}$ | 24-hour pressure drop ($\Delta P < -6 \text{ hPa}$ indicates approaching `CYCLONE`). |
| 17 | `pressure_change_3d` | hPa | $P_t - P_{t-3}$ | 72-hour sustained barometric depression indicator. |
| 18 | `wind_speed_10m_mean` | km/h | $\frac{1}{24}\sum_{h=1}^{24} W_h$ | Sustained surface wind speeds. |
| 19 | `wind_speed_10m_max` | km/h | $\max_{h=1..24} (W_h)$ | Peak gusts capable of causing structural and grid damage. |
| 20 | `wind_3d_mean` | km/h | $\frac{1}{3}\sum_{i=0}^{2} W_{t-i}$ | 3-day sustained wind persistence. |
| 21 | `wind_7d_mean` | km/h | $\frac{1}{7}\sum_{i=0}^{6} W_{t-i}$ | Medium-term storm system persistence. |
| 22 | `wind_max_7d` | km/h | $\max_{i=0..6} (W_{\text{max}, t-i})$ | Highest wind gust recorded across the trailing 7-day window. |
| 23 | `wind_direction_10m_dominant`| Degrees | Mode$(\theta_{1..24})$ | Prevailing monsoon or cyclone inflow direction (0°–360°). |

---

## 4. Dataset Preprocessing & Balancing Protocol

### 4.1 Missing Value Treatment
* Missing numerical values are handled using forward/backward linear interpolation within chronological series per coordinate.
* During inference and training pipeline serialization, feature medians computed strictly on the training partition ($X_{\text{train}}$) are stored in the model artifact to perform deterministic imputation without data leakage.

### 4.2 Class Imbalance Correction
In real-world observational data, non-disaster days (`NORMAL`) outnumber extreme disaster days by more than $50:1$. To ensure model sensitivity without overwhelming false positive rates:
1. **Subsampling**:
   * Cap baseline `NORMAL` days to $N_{\text{max}} = 100,000$.
   * Retain all real disaster samples up to $N_{\text{per\_disaster}} = 100,000$.
2. **Cost-Sensitive Weighting**:
   Inverse frequency class weights are dynamically computed and assigned to the loss function during decision tree splits:
   $$w_c = \frac{N_{\text{total}}}{K \cdot N_c}$$
   Where $N_{\text{total}}$ is total training samples, $K$ is the number of classes (7), and $N_c$ is the count of class $c$.

### 4.3 Temporal Splitting Protocol
To simulate realistic predictive performance on future unseen events, **no random K-fold shuffling** is used across time. Data is partitioned chronologically:
* **Training Partition (70%)**: Earliest chronological records for model parameter fitting.
* **Validation Partition (15%)**: Intermediate chronological block for hyperparameter tuning and early stopping.
* **Testing Partition (15%)**: Most recent chronological holdout set for unbiased generalizability assessment.

---

## 5. Production Machine Learning Model Architecture

* **Algorithm**: Optimized `RandomForestClassifier` (Scikit-Learn).
* **Ensemble Hyperparameters**:
  * `n_estimators`: 200 trees
  * `max_depth`: 18 levels
  * `min_samples_leaf`: 3 samples per leaf
  * `class_weight`: Precomputed balanced dictionary
  * `n_jobs`: Parallelized across all CPU cores
* **Model Serialization**: Compressed using `joblib` with Level-9 Zlib compression (`compress=9`), reducing disk footprint from **446 MB to 80.29 MB**, allowing deployment within memory-constrained cloud environments and direct version control tracking.

---

## 6. Operational Relational Schemas (MySQL)

In addition to the ML feature store, the platform maintains relational operational data across multiple core schemas:

### 6.1 State & Geographic Entities
* **`states`**: Master records of Indian states with latitude/longitude anchors, emergency contact emails, and active disaster alert status.
* **`districts`**: District-level spatial coordinates providing geo-granularity for predictions and resource requests.

### 6.2 Strategic Warehouses & Logistics Hubs
* **`warehouses`**: Strategic storage centers (Kerala Central, Ernakulam, Tamil Nadu, Andhra Pradesh, Maharashtra, Odisha).
* **`warehouse_inventory`**: Real-time stock tracking for 10 essential relief categories with safety threshold buffers.

### 6.3 Disaster Relief Resource Catalog (10 Standard Items)
1. **Drinking Water** (Liters / 20L Cans)
2. **Food Packets** (Kits / Carton)
3. **Medical First Aid Kits** (Sterile Emergency Packs)
4. **Tents & Tarpaulins** (Weatherproof Family Units)
5. **Blankets & Thermal Wear** (Pieces)
6. **Water Purification Units** (Portable RO/Chlorination Units)
7. **Portable Generators** (5kVA Diesel Generator Units)
8. **Emergency Rescue Boats** (Inflatable Motorized Rafts)
9. **PPE Kits & Safety Gear** (Protective Suits & Helmets)
10. **Satellite Communication Gear** (Satellite Phones & Handheld Radios)

### 6.4 Telemetry & Audit Stores
* **`prediction_runs`**: Stores all live and manual AI model executions with input weather parameters, predicted class, probability percentages, severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and model IDs.
* **`resource_movements` & Blockchain Hashes**: Every transit step between warehouses and disaster zones is recorded with driver details, dispatch timestamps, receipt timestamps, and corresponding Ethereum smart contract transaction hashes.

---

## 7. Real-Time Telemetry & Live Inference Workflow

```
[User / Cron Trigger]
       │
       ▼
[Open-Meteo Live API] ───> Fetches real-time temperature, precipitation, pressure, wind
       │
       ▼
[Feature Engine] ───────> Computes 23 rolling & differential metrics
       │
       ▼
[FastAPI /predict] ──────> Evaluates via disaster_random_forest.joblib
       │
       ▼
[Severity Matrix]
   ├── Probability ≥ 80% ──> CRITICAL (Auto-triggers Quantum allocation candidate)
   ├── Probability ≥ 60% ──> HIGH
   ├── Probability ≥ 40% ──> MEDIUM
   └── Probability < 40% ──> LOW
       │
       ▼
[MySQL Logging] ─────────> Saved into prediction_runs with JSON feature snapshots
```

# National Disaster Management & Resource Allocation System
## Compendium of Mathematical Models, Formulations & Algorithmic Equations

**Subject / Domain**: Cloud Computing (Semester 5 Capstone)  
**System Architecture**: Distributed Multi-Tier Microservices Platform  
**Runtimes & Frameworks**: Scikit-Learn (Python 3.13), IBM Qiskit 1.x, Copernicus Sentinel Radiometry, Solidity 0.8.20 / Ethers.js, MySQL 8.0 InnoDB  
**Document Classification**: Mathematical Specification & Theoretical Foundations  
**Document Version**: 2.0.0 (Production Verified)

---

## Table of Contents
1. [Executive Summary & Methodological Overview](#1-executive-summary--methodological-overview)
2. [Machine Learning & Atmospheric Predictive Models](#2-machine-learning--atmospheric-predictive-models)
   - 2.1 [14-Day Sliding Meteorological Time-Series Signal Model](#21-14-day-sliding-meteorological-time-series-signal-model)
   - 2.2 [Cyclical Trigonometric Temporal Encodings](#22-cyclical-trigonometric-temporal-encodings)
   - 2.3 [Indian Meteorological Department (IMD) Hazard Indicators](#23-indian-meteorological-department-imd-hazard-indicators)
   - 2.4 [Random Forest Ensemble Classification Model](#24-random-forest-ensemble-classification-model)
   - 2.5 [Calibrated Severity Piecewise Step Function](#25-calibrated-severity-piecewise-step-function)
   - 2.6 [Demographic Exposure & Population-at-Risk Formulation](#26-demographic-exposure--population-at-risk-formulation)
   - 2.7 [Comparative Evaluated Baseline Models (SVM, Logistic Regression)](#27-comparative-evaluated-baseline-models-svm-logistic-regression)
3. [Earth Observation & Satellite Remote Sensing Models](#3-earth-observation--satellite-remote-sensing-models)
   - 3.1 [Normalized Difference Water Index (NDWI - Sentinel-2)](#31-normalized-difference-water-index-ndwi---sentinel-2)
   - 3.2 [Modified Normalized Difference Water Index (MNDWI)](#32-modified-normalized-difference-water-index-mndwi)
   - 3.3 [Synthetic Aperture Radar (SAR) Backscatter Calibration (Sentinel-1)](#33-synthetic-aperture-radar-sar-backscatter-calibration-sentinel-1)
   - 3.4 [Bounding Box Geodesic Spatial Coordinate Expansion](#34-bounding-box-geodesic-spatial-coordinate-expansion)
   - 3.5 [Haversine Great-Circle Geodesic Distance Model](#35-haversine-great-circle-geodesic-distance-model)
4. [Quantum Combinatorial Resource Optimization Models (IBM Qiskit)](#4-quantum-combinatorial-resource-optimization-models-ibm-qiskit)
   - 4.1 [Multi-Objective Logistics Cost Function](#41-multi-objective-logistics-cost-function)
   - 4.2 [Quadratic Unconstrained Binary Optimization (QUBO) & Ising Mapping](#42-quadratic-unconstrained-binary-optimization-qubo--ising-mapping)
   - 4.3 [QAOA Parameterized Quantum Circuit Layer Architecture](#43-qaoa-parameterized-quantum-circuit-layer-architecture)
   - 4.4 [Statevector Sampling & Born Probability Distribution](#44-statevector-sampling--born-probability-distribution)
   - 4.5 [Classical Baseline Knapsack & Integer Linear Programming (ILP) Model](#45-classical-baseline-knapsack--integer-linear-programming-ilp-model)
5. [Supply Chain Logistics & Inventory Balance Models](#5-supply-chain-logistics--inventory-balance-models)
   - 5.1 [Real-Time Usable Stock Calculation Equation](#51-real-time-usable-stock-calculation-equation)
   - 5.2 [Two-Phase Atomic Stock Reservation State Transitions](#52-two-phase-atomic-stock-reservation-state-transitions)
   - 5.3 [Per-Capita Resource Demand Synthesis Equation](#53-per-capita-resource-demand-synthesis-equation)
   - 5.4 [Regional Deficit & Shortage Allocation Formulation](#54-regional-deficit--shortage-allocation-formulation)
6. [Blockchain Cryptography & Decentralized Consensus Models](#6-blockchain-cryptography--decentralized-consensus-models)
   - 6.1 [Keccak-256 Sponge Construction Formulation](#61-keccak-256-sponge-construction-formulation)
   - 6.2 [Deterministic Supply-Chain Canonical Data Hashing](#62-deterministic-supply-chain-canonical-data-hashing)
   - 6.3 [secp256k1 Elliptic Curve Digital Signature Algorithm (ECDSA)](#63-secp256k1-elliptic-curve-digital-signature-algorithm-ecdsa)
   - 6.4 [State Trie Root & Block Mining Finality Equation](#64-state-trie-root--block-mining-finality-equation)
7. [Comprehensive Model Inventory & Cross-Reference Catalog](#7-comprehensive-model-inventory--cross-reference-catalog)

---

## 1. Executive Summary & Methodological Overview

The **National Disaster Management and Resource Allocation System (NDMRAS)** is grounded on rigorous mathematical principles spanning five interlinked computational layers:
* **Predictive Layer**: Stochastic time-series statistical signal processing and ensemble decision trees.
* **Spatial Remote Sensing Layer**: Radiometric spectral reflection ratio indexing and spherical trigonometry.
* **Quantum Decision Layer**: Hamiltonian operators in $2^n$-dimensional Hilbert space parameterized by unitary rotation matrices.
* **Logistics Balance Layer**: Discrete piecewise inventory constraints and multi-warehouse state machines.
* **Cryptographic Layer**: Finite-field elliptic curves and cryptographic sponge hash functions.

This document compiles every mathematical formula, variable definition, boundary condition, and algorithm implemented across the platform.

---

## 2. Machine Learning & Atmospheric Predictive Models

Implemented in:
* `ml-service/app.py`
* `ml-service/train_improved_flood_model.py`
* `ml-service/engineer_flood_features.py`
* `backend/src/services/livePredictionService.js`

### 2.1 14-Day Sliding Meteorological Time-Series Signal Model

Atmospheric observations are represented as a discrete multivariate discrete time series $\mathbf{X}_t \in \mathbb{R}^K$ sampled daily over a backward-looking sliding window $W = 14$ days:

$$\mathcal{T} = \{t - 13, t - 12, \dots, t - 1, t\}$$

#### 1. Cumulative Precipitation Sums
The rainfall accumulation over an arbitrary duration window $k \in \{1, 3, 7, 14\}$ is defined as:

$$R_{k\text{d}}(t) = \sum_{j=0}^{k-1} p(t - j)$$

Where $p(\tau)$ is the total surface liquid precipitation (in millimeters) recorded on day $\tau$.

#### 2. Moving Average Precipitation
The moving mean rainfall intensity over window $k \in \{3, 7\}$ days:

$$\bar{R}_{k\text{d}}(t) = \frac{1}{k} \sum_{j=0}^{k-1} p(t - j) = \frac{R_{k\text{d}}(t)}{k}$$

#### 3. Sliding Window Maximum Precipitation
The peak 24-hour storm burst observed during the preceding window $k \in \{3, 7\}$:

$$\hat{R}_{k\text{d}}(t) = \max_{0 \le j < k} p(t - j)$$

#### 4. Barometric Pressure Gradient (Tendency)
Atmospheric barometric pressure drops signal approaching cyclonic depressions and low-pressure monsoon troughs. The 1-day and 3-day pressure gradients (tendency) are modeled as:

$$\Delta P_{1\text{d}}(t) = P(t) - P(t - 1)$$

$$\Delta P_{3\text{d}}(t) = P(t) - P(t - 3)$$

Where $P(\tau)$ is the mean sea-level / surface barometric pressure (in hectopascals, $\text{hPa}$). The dedicated cyclonic **pressure drop indices** isolate negative deltas:

$$P_{\text{drop}, 1\text{d}}(t) = \max\left(0, -\Delta P_{1\text{d}}(t)\right)$$

$$P_{\text{drop}, 3\text{d}}(t) = \max\left(0, -\Delta P_{3\text{d}}(t)\right)$$

#### 5. Diurnal Temperature Swing
The daily thermal expansion/contraction of local air masses, indicating convective storm potential:

$$\Delta T(t) = T_{\max}(t) - T_{\min}(t)$$

Where $T_{\max}$ and $T_{\min}$ are the 2-meter ambient temperatures in degrees Celsius.

#### 6. Hydrological Rainfall Ratios & Acceleration
To capture sudden rainfall saturation acceleration relative to chronic baseline levels:

$$\rho_{3/7}(t) = \frac{R_{3\text{d}}(t)}{R_{7\text{d}}(t) + \epsilon}$$

$$\rho_{7/14}(t) = \frac{R_{7\text{d}}(t)}{R_{14\text{d}}(t) + \epsilon}$$

$$\alpha_{\text{rain}}(t) = R_{1\text{d}}(t) - \bar{R}_{3\text{d}}(t)$$

Where $\epsilon = 10^{-5}$ prevents division-by-zero during completely dry spells. A positive acceleration $\alpha_{\text{rain}} > 0$ indicates rapid cloudburst onset.

---

### 2.2 Cyclical Trigonometric Temporal Encodings

Calendar features (month of year $m \in [1, 12]$ and day of year $d \in [1, 365]$) exhibit continuous circular topology (i.e. December 31 is adjacent to January 1). Standard integer representation introduces an artificial numerical discontinuity. NDMRAS projects temporal coordinates onto the unit circle using orthogonal harmonic basis functions:

$$\tau_{m, \sin} = \sin\left(\frac{2\pi \cdot m}{12}\right), \quad \tau_{m, \cos} = \cos\left(\frac{2\pi \cdot m}{12}\right)$$

$$\tau_{d, \sin} = \sin\left(\frac{2\pi \cdot d}{365.25}\right), \quad \tau_{d, \cos} = \cos\left(\frac{2\pi \cdot d}{365.25}\right)$$

This preserves Euclidean distance $\|\boldsymbol{\tau}(t_1) - \boldsymbol{\tau}(t_2)\|_2$ across year-end seasonal boundaries.

---

### 2.3 Indian Meteorological Department (IMD) Hazard Indicators

Categorical meteorological danger flags are modeled as binary indicator step functions $\mathbb{I}(\cdot) \in \{0, 1\}$ strictly calibrated to national disaster management standards:

$$\text{HeavyRainDay}(t) = \mathbb{I}\left(R_{1\text{d}}(t) \ge 64.5\text{ mm}\right)$$

$$\text{VeryHeavyRainDay}(t) = \mathbb{I}\left(R_{1\text{d}}(t) \ge 115.5\text{ mm}\right)$$

$$\text{Extreme3dRain}(t) = \mathbb{I}\left(R_{3\text{d}}(t) \ge 200.0\text{ mm}\right)$$

$$\text{Extreme7dRain}(t) = \mathbb{I}\left(R_{7\text{d}}(t) \ge 350.0\text{ mm}\right)$$

Monsoonal seasonal regimes:
$$\text{SouthwestMonsoon}(m) = \mathbb{I}\left(m \in \{6, 7, 8, 9\}\right)$$

$$\text{NortheastMonsoon}(m) = \mathbb{I}\left(m \in \{10, 11, 12\}\right)$$

---

### 2.4 Random Forest Ensemble Classification Model

The core classifier model (`disaster_random_forest.joblib`) consists of an ensemble of $M = 400$ de-correlated binary decision trees:

$$\mathcal{M} = \{h_1(\mathbf{x}), h_2(\mathbf{x}), \dots, h_M(\mathbf{x})\}$$

#### 1. Splitting Criterion (Gini Impurity)
At each interior node $t$ splitting dataset $D_t$ on feature $j$ with threshold $\theta$, the impurity of partition $t$ is:

$$I_G(t) = 1 - \sum_{c \in \mathcal{C}} p(c \mid t)^2$$

Where $p(c \mid t) = \frac{1}{|D_t|} \sum_{\mathbf{x}_i \in D_t} \mathbb{I}(y_i = c)$ is the empirical frequency of disaster class $c$. The optimal split maximizes the Information Gain $\Delta I_G$:

$$\Delta I_G(t, j, \theta) = I_G(t) - \left( \frac{|D_L|}{|D_t|} I_G(t_L) + \frac{|D_R|}{|D_t|} I_G(t_R) \right)$$

#### 2. Class Probability Aggregation
The probability that weather feature vector $\mathbf{x} \in \mathbb{R}^{23}$ represents disaster event class $c$ is computed via soft-voting ensemble consensus:

$$P(Y = c \mid \mathbf{x}) = \frac{1}{M} \sum_{m=1}^M P_m(Y = c \mid \mathbf{x})$$

The final predicted class $\hat{y}$ corresponds to maximum likelihood:

$$\hat{y} = \arg\max_{c \in \mathcal{C}} P(Y = c \mid \mathbf{x})$$

#### 3. Hyperparameter Architecture Specifications
* **Number of Trees ($M$)**: `400`
* **Maximum Tree Depth**: `20`
* **Minimum Samples per Leaf**: `5`
* **Sample Bootstrapping**: Enabled with replacement
* **Class Weighting Scheme**: Balanced inverse-frequency:
  $$w_c = \frac{N}{|\mathcal{C}| \cdot N_c}$$
* **Feature Vector Dimension**: $K = 23$ numerical features

---

### 2.5 Calibrated Severity Piecewise Step Function

The categorical severity tier assigned to a detected disaster is determined through a monotonic piecewise step function operating on the predicted class probability $P = P(\text{Disaster} \mid \mathbf{x})$:

$$\text{Severity}(P) = \begin{cases} 
\text{CRITICAL} & \text{if } P \ge 0.80 \\ 
\text{HIGH} & \text{if } 0.60 \le P < 0.80 \\ 
\text{MEDIUM} & \text{if } 0.40 \le P < 0.60 \\ 
\text{LOW} & \text{if } P < 0.40 
\end{cases}$$

---

### 2.6 Demographic Exposure & Population-at-Risk Formulation

NDMRAS synthesizes the number of citizens requiring immediate state relief intervention ($N_{\text{affected}}$) through two complementary mathematical models:

#### 1. Empirical Severity-Baseline Model
Implemented in `backend/src/services/livePredictionService.js`:

$$N_{\text{affected}} = \operatorname{round}\left( \text{BasePopulation}\left(\text{Severity}\right) \times P \right)$$

Where the baseline demographic exposure constants are defined as:
$$\text{BasePopulation}(S) = \begin{cases}
50{,}000 & \text{for } S = \text{CRITICAL} \\
25{,}000 & \text{for } S = \text{HIGH} \\
10{,}000 & \text{for } S = \text{MEDIUM} \\
5{,}000 & \text{for } S = \text{LOW}
\end{cases}$$

*Example: For a flood event with $P = 0.95$ (CRITICAL severity), $N_{\text{affected}} = \operatorname{round}(50{,}000 \times 0.95) = 47{,}500$ people (or $15{,}000$ in regional district boundary simulations).*

#### 2. Spatial Density Integration Model
When district geographic GIS boundaries and census densities are supplied:

$$N_{\text{affected}} = \iint_{\mathcal{A}_{\text{hazard}}} \rho_{\text{pop}}(x, y) \cdot W_{\text{severity}} \cdot P \, dx \, dy \approx A_{\text{hazard}} \times \bar{\rho}_{\text{district}} \times W_{\text{severity}} \times P$$

Where:
* $A_{\text{hazard}}$: Geographic area of inundation perimeter in $\text{km}^2$.
* $\bar{\rho}_{\text{district}}$: Census population density in $\text{persons}/\text{km}^2$.
* $W_{\text{severity}} \in \{0.20, 0.45, 0.75, 1.00\}$: Calibrated impact depth multiplier.

---

### 2.7 Comparative Evaluated Baseline Models (SVM, Logistic Regression)

During model selection in `ml-service/`, baseline classifiers were trained and benchmarked against Random Forest:

#### 1. Multiclass Logistic Regression (Softmax Baseline)
$$P(Y = c \mid \mathbf{x}) = \frac{\exp\left(\mathbf{w}_c^T \mathbf{x} + b_c\right)}{\sum_{k=1}^{|\mathcal{C}|} \exp\left(\mathbf{w}_k^T \mathbf{x} + b_k\right)}$$

$$\min_{\mathbf{W}, \mathbf{b}} -\frac{1}{N} \sum_{i=1}^N \sum_{c=1}^{|\mathcal{C}|} \mathbb{I}(y_i = c) \ln P(Y = c \mid \mathbf{x}_i) + \frac{\lambda}{2} \sum_{c=1}^{|\mathcal{C}|} \|\mathbf{w}_c\|_2^2$$

#### 2. Support Vector Machine with Radial Basis Function (RBF Kernel)
$$f(\mathbf{x}) = \operatorname{sign}\left( \sum_{i=1}^{N_{\text{sv}}} \alpha_i y_i K(\mathbf{x}_i, \mathbf{x}) + b \right)$$

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\gamma \|\mathbf{x}_i - \mathbf{x}_j\|^2\right), \quad \gamma = \frac{1}{K \cdot \sigma_X^2}$$

*Evaluation Result*: Random Forest achieved superior Area Under the Precision-Recall Curve ($\text{PR-AUC} = 0.914$) over SVM ($\text{PR-AUC} = 0.823$) due to its resistance to non-linear meteorological feature correlations.

---

## 3. Earth Observation & Satellite Remote Sensing Models

Implemented in:
* `backend/src/services/satelliteService.js`
* `backend/src/controllers/satelliteController.js`

### 3.1 Normalized Difference Water Index (NDWI - Sentinel-2)

NDWI isolates surface water bodies from surrounding soil and vegetation by exploiting the strong absorption of Near-Infrared (NIR) radiation by liquid water and high reflectance in the Green spectrum:

$$\text{NDWI} = \frac{\rho_{B3} - \rho_{B8}}{\rho_{B3} + \rho_{B8}}$$

Where:
* $\rho_{B3}$: Bottom-Of-Atmosphere (BOA) reflectance in Sentinel-2 Band 3 (Green, central wavelength $\lambda = 560\text{ nm}$).
* $\rho_{B8}$: BOA reflectance in Sentinel-2 Band 8 (Wide NIR, central wavelength $\lambda = 842\text{ nm}$).

**Classification Decision Boundary**:
$$\text{Surface Pixel}(x, y) = \begin{cases}
\text{Open Water / Inundated Land} & \text{if } \text{NDWI}(x, y) > 0.0 \\
\text{Vegetation / Dry Soil} & \text{if } \text{NDWI}(x, y) \le 0.0
\end{cases}$$

---

### 3.2 Modified Normalized Difference Water Index (MNDWI)

To eliminate false water positives caused by urban infrastructure and concrete buildings in flooded cities:

$$\text{MNDWI} = \frac{\rho_{B3} - \rho_{B11}}{\rho_{B3} + \rho_{B11}}$$

Where $\rho_{B11}$ is Sentinel-2 Short-Wave Infrared (SWIR, central wavelength $\lambda = 1610\text{ nm}$). Built-up areas exhibit positive reflectance in SWIR, effectively suppressing urban false alarms.

---

### 3.3 Synthetic Aperture Radar (SAR) Backscatter Calibration (Sentinel-1)

Synthetic Aperture Radar utilizes active microwave pulses (C-band, $\lambda = 5.546\text{ cm}$) to penetrate clouds and rain. The raw Digital Number ($DN$) pixel values from `sentinel-1-grd` are converted to calibrated radar backscatter coefficient $\sigma^0$ (sigma nought):

$$\sigma^0 = \frac{DN^2}{A_{\sigma}^2}$$

$$\sigma^0_{\text{dB}} = 10 \log_{10}(\sigma^0)$$

Where $A_{\sigma}$ is the calibration LUT amplitude factor. Smooth open floodwaters act as specular reflectors, scattering radar pulses away from the sensor, producing low backscatter:

$$\text{Flooded Terrain} \iff \sigma^0_{\text{dB}} < -14.5\text{ dB (on VV polarization)}$$

---

### 3.4 Bounding Box Geodesic Spatial Coordinate Expansion

Given a disaster epicenter coordinate $(\phi_0, \lambda_0) = (\text{latitude}, \text{longitude})$, the satellite observation bounding box $\mathcal{B}$ is generated by expanding an angular aperture $\Delta = 0.05^\circ$ ($\approx 5.55\text{ km}$ ground radius):

$$\mathcal{B} = \left[ \lambda_{\min}, \phi_{\min}, \lambda_{\max}, \phi_{\max} \right] = \left[ \lambda_0 - \Delta, \phi_0 - \Delta, \lambda_0 + \Delta, \phi_0 + \Delta \right]$$

---

### 3.5 Haversine Great-Circle Geodesic Distance Model

Implemented in `backend/src/services/quantumCandidateService.js`:

To compute exact highway/air distances between disaster centroids and candidate storage warehouses on the spherical Earth geoid:

$$d = 2 R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

Where $a$ is the square of the half-chord length between the two points:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$

And:
* $\Delta \phi = \frac{\pi}{180} (\phi_2 - \phi_1)$ (latitude difference in radians)
* $\Delta \lambda = \frac{\pi}{180} (\lambda_2 - \lambda_1)$ (longitude difference in radians)
* $\phi_1, \phi_2$: Geodetic latitudes in radians
* $R = 6371.0\text{ km}$ (Mean volumetric Earth radius)

---

## 4. Quantum Combinatorial Resource Optimization Models (IBM Qiskit)

Implemented in:
* `quantum/optimizer.py`
* `quantum/app.py`
* `backend/src/services/quantumOptimizationService.js`

### 4.1 Multi-Objective Logistics Cost Function

Given an emergency requisition requiring $D_r$ units of resource $r$, and a set of $n$ candidate warehouses $\mathcal{W} = \{w_1, w_2, \dots, w_n\}$, each warehouse possesses usable stock $S_{i,r}$ and geodesic transit distance $d_i$.

The scalar cost metric $C_i \in [0, 1.60]$ for warehouse $w_i$ is formulated as:

$$C_i = w_d \cdot \hat{d}_i + w_s \cdot (1 - \hat{f}_i) \cdot \omega_p + w_u \cdot (1 - \hat{f}_i)$$

Where:
* **Normalized Distance Factor**:
  $$\hat{d}_i = \frac{d_i - \min_{j} d_j}{\max_{j} d_j - \min_{j} d_j} \in [0, 1]$$
  *(defaults to $\hat{d}_i = \frac{d_i}{\max d}$ when $\min d = 0$).*
* **Fulfillment Fraction**:
  $$\hat{f}_i = \begin{cases} 1.0 & \text{if } D_r \le 0 \\ \min\left(\frac{S_{i,r}}{D_r}, 1.0\right) & \text{if } D_r > 0 \end{cases}$$
* **Shortage Penalty**:
  $$\text{Penalty}_{\text{short}} = 1.0 - \hat{f}_i$$
* **Emergency Priority Multiplier**:
  $$\omega_p = \begin{cases}
  1.0 & \text{for LOW} \\
  1.5 & \text{for MEDIUM} \\
  2.0 & \text{for HIGH} \\
  3.0 & \text{for CRITICAL}
  \end{cases}$$
* **Constituent Weight Parameters**:
  * Distance Weight: $w_d = 0.40$
  * Priority Shortage Weight: $w_s = 0.50$
  * Residual Deficit Weight: $w_u = 0.10$
  * Invariant: $w_d + w_s + w_u = 1.00$

---

### 4.2 Quadratic Unconstrained Binary Optimization (QUBO) & Ising Mapping

Let $x_i \in \{0, 1\}$ represent the binary decision variable indicating whether warehouse $i$ is activated in the dispatch network ($x_i = 1$) or deactivated ($x_i = 0$).

The problem maps to an Ising Spin Hamiltonian through the linear transformation:

$$z_i = 1 - 2 x_i \iff x_i = \frac{I - Z_i}{2}, \quad z_i \in \{-1, +1\}$$

Where $Z_i$ is the Pauli-$Z$ quantum spin operator:

$$Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}, \quad I = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$$

The Problem Hamiltonian $\hat{H}_C$ is diagonal in the computational basis:

$$\hat{H}_C = \sum_{j=1}^n C_j x_j = \sum_{j=1}^n C_j \left( \frac{I - Z_j}{2} \right)$$

---

### 4.3 QAOA Parameterized Quantum Circuit Layer Architecture

The Quantum Approximate Optimization Algorithm (QAOA) operates on a register of $n$ qubits (one qubit per candidate warehouse).

```
|0⟩ ── H ── Rz(2γ C₁) ── Rx(2β) ── M ──
|0⟩ ── H ── Rz(2γ C₂) ── Rx(2β) ── M ──
...
|0⟩ ── H ── Rz(2γ Cₙ) ── Rx(2β) ── M ──
```

#### Step 1: Initial Superposition State Layer
All qubits are initialized in the ground state $|0\rangle^{\otimes n}$. An $n$-fold Hadamard transform $H^{\otimes n}$ maps the register into an equal superposition of all $2^n$ possible dispatch combinations:

$$|\psi_0\rangle = H^{\otimes n} |0\rangle^{\otimes n} = \frac{1}{\sqrt{2^n}} \sum_{x \in \{0,1\}^n} |x\rangle$$

Where the single-qubit Hadamard gate is:
$$H = \frac{1}{\sqrt{2}} \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$

#### Step 2: Problem Hamiltonian Evolution Layer ($R_z$)
Phase separation is applied proportional to each warehouse's calculated cost $C_j$ with variational angle parameter $\gamma = \frac{\pi}{4}$:

$$U(C, \gamma) = \exp\left(-i \gamma \hat{H}_C\right) = \prod_{j=1}^n R_z\left(2 \gamma C_j\right)$$

Where the single-qubit rotation gate about the $Z$-axis is:

$$R_z(\theta) = \exp\left(-i \frac{\theta}{2} Z\right) = \begin{pmatrix} \exp\left(-i \frac{\theta}{2}\right) & 0 \\ 0 & \exp\left(i \frac{\theta}{2}\right) \end{pmatrix}$$

#### Step 3: Mixer Hamiltonian Evolution Layer ($R_x$)
Transverse non-commuting magnetic mixing allows quantum tunneling and interference across basis states with angle $\beta = \frac{\pi}{4}$:

$$\hat{H}_B = \sum_{j=1}^n X_j, \quad X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$$

$$U(B, \beta) = \exp\left(-i \beta \hat{H}_B\right) = \prod_{j=1}^n R_x\left(2 \beta\right)$$

Where the rotation gate about the $X$-axis is:

$$R_x(\theta) = \exp\left(-i \frac{\theta}{2} X\right) = \begin{pmatrix} \cos\left(\frac{\theta}{2}\right) & -i\sin\left(\frac{\theta}{2}\right) \\ -i\sin\left(\frac{\theta}{2}\right) & \cos\left(\frac{\theta}{2}\right) \end{pmatrix}$$

#### Step 4: Quantum Wavefunction Ansatz
For depth $p = 1$, the final statevector $|\psi(\gamma, \beta)\rangle$ before measurement is:

$$|\psi(\gamma, \beta)\rangle = U(B, \beta) \cdot U(C, \gamma) |\psi_0\rangle$$

---

### 4.4 Statevector Sampling & Born Probability Distribution

Measurement collapse in Qiskit `StatevectorSampler(seed=42)` across $N_{\text{shots}} = 1024$ runs produces a probability distribution over bitstrings $x \in \{0, 1\}^n$ according to Born's Rule:

$$P(x) = \left| \langle x | \psi(\gamma, \beta) \rangle \right|^2, \quad \sum_{x \in \{0,1\}^n} P(x) = 1.0$$

The empirical shot count $N(x)$ observed for bitstring $x$ satisfies:

$$N(x) \sim \operatorname{Multinomial}\left(N_{\text{shots}}, P(x)\right)$$

The bitstrings are sorted descending by frequency:
$$x_{(1)} \succ x_{(2)} \succ \dots \succ x_{(2^n)}$$

The active warehouse indices ($x_j = 1$) corresponding to the highest probability state are selected as the optimal dispatch order.

---

### 4.5 Classical Baseline Knapsack & Integer Linear Programming (ILP) Model

To validate the quantum solution, a classical bounded knapsack formulation is solved:

$$\min_{\mathbf{x}} \sum_{i=1}^n \left( 0.40 \cdot \hat{d}_i + 0.60 \cdot \omega_p \right) x_i$$

$$\text{subject to: } \sum_{i=1}^n S_{i,r} x_i \ge D_r, \quad x_i \in \{0, 1\} \quad \forall i \in \{1, \dots, n\}$$

---

## 5. Supply Chain Logistics & Inventory Balance Models

Implemented in:
* `backend/src/services/resourceRequirementService.js`
* `backend/src/services/resourceAllocationService.js`
* `backend/src/services/resourceMovementService.js`

### 5.1 Real-Time Usable Stock Calculation Equation

To prevent catastrophic double-allocation when multiple disasters draw supplies from regional stockpiles, inventory records in table `warehouse_resources` maintain separate availability and reservation counters:

$$U_{i,r} = \max\left(A_{i,r} - R_{i,r}, 0\right)$$

Where:
* $U_{i,r}$: **Usable Free Stock** of resource $r$ at warehouse $i$.
* $A_{i,r}$: **Quantity Available** (physical stock in warehouse).
* $R_{i,r}$: **Quantity Reserved** (committed to approved allocations awaiting dispatch).

---

### 5.2 Two-Phase Atomic Stock Reservation State Transitions

The inventory lifecycle is modeled as a strictly conserved state machine:

```
[Available: 100, Reserved: 0, Usable: 100]
                  │
     (Phase 1: Allocation Approval)
                  ▼
[Available: 100, Reserved: 30, Usable: 70]
                  │
     (Phase 2: Physical Dispatch)
                  ▼
[Available: 70,  Reserved: 0,  Usable: 70]
```

#### Phase 1: Requisition Allocation Approval
When National Command authorizes allocation quantity $q_{\text{alloc}} \le U_{i,r}$:

$$R_{i,r}^{(t+1)} = R_{i,r}^{(t)} + q_{\text{alloc}}$$

$$A_{i,r}^{(t+1)} = A_{i,r}^{(t)}$$

$$U_{i,r}^{(t+1)} = \max\left(A_{i,r}^{(t+1)} - R_{i,r}^{(t+1)}, 0\right) = U_{i,r}^{(t)} - q_{\text{alloc}}$$

#### Phase 2: Physical Warehouse Dispatch
When the truck departs the warehouse gate (`POST /resource-movements/:id/dispatch`):

$$A_{i,r}^{(t+2)} = A_{i,r}^{(t+1)} - q_{\text{alloc}}$$

$$R_{i,r}^{(t+2)} = R_{i,r}^{(t+1)} - q_{\text{alloc}}$$

$$U_{i,r}^{(t+2)} = \max\left(A_{i,r}^{(t+2)} - R_{i,r}^{(t+2)}, 0\right) = U_{i,r}^{(t+1)}$$

**Global Invariant**:
$$A_{i,r}(t) \ge R_{i,r}(t) \ge 0 \quad \forall t \ge 0$$

---

### 5.3 Per-Capita Resource Demand Synthesis Equation

Requisition requirements $Q_{\text{req}, r}$ are synthesized from table `resource_requirement_rules`:

$$Q_{\text{req}, r} = \begin{cases}
N_{\text{affected}} \times q_{\text{per\_person}, r} & \text{if } q_{\text{per\_person}, r} \neq \text{null} \\
Q_{\text{fixed}, r} & \text{if } Q_{\text{fixed}, r} \neq \text{null}
\end{cases}$$

Standard per-capita emergency multipliers for FLOOD (Severity = HIGH / CRITICAL):
* **Emergency Food Kits**: $q_{\text{food}} = 1.0\text{ kit / person}$
* **Drinking Water**: $q_{\text{water}} = 2.0\text{ litres / person}$
* **Medical First-Aid Kits**: $q_{\text{medical}} = 0.10\text{ kit / person}$ (1 kit per 10 citizens)
* **Rescue Boats**: Fixed quota $Q_{\text{boats}} = 50\text{ units}$ per disaster sector

---

### 5.4 Regional Deficit & Shortage Allocation Formulation

The net deficit (unmet demand) across all accessible storage depots $\mathcal{W}$ is:

$$\text{Shortage}_r = \max\left(Q_{\text{req}, r} - \sum_{i \in \mathcal{W}} U_{i,r}, 0\right)$$

The allocated quantity from warehouse $i$ satisfies the capacity bound:

$$0 \le q_{\text{alloc}, i, r} \le U_{i,r}, \quad \sum_{i \in \mathcal{W}} q_{\text{alloc}, i, r} = \min\left(Q_{\text{req}, r}, \sum_{i \in \mathcal{W}} U_{i,r}\right)$$

---

## 6. Blockchain Cryptography & Decentralized Consensus Models

Implemented in:
* `blockchain/contracts/DisasterAudit.sol`
* `backend/src/services/blockchainService.js`
* `backend/src/services/blockchainAuditService.js`

### 6.1 Keccak-256 Sponge Construction Formulation

Data integrity proofs on Ethereum utilize the **Keccak-256** cryptographic sponge function.

$$\text{Keccak-256}: \{0, 1\}^* \to \{0, 1\}^{256}$$

The internal state $S$ consists of a 3-dimensional bit array of dimensions $5 \times 5 \times 64 = 1600$ bits:

$$S = A[x, y, z], \quad x, y \in \{0, 1, 2, 3, 4\}, \quad z \in \{0, 1, \dots, 63\}$$

The sponge operates in two phases with bitrate $r = 1088$ bits and capacity $c = 512$ bits ($r + c = 1600$):
1. **Absorbing Phase**: Message blocks $P_i$ are XORed into the bitrate:
   $$S_{i} = f\left(S_{i-1} \oplus (P_i \parallel 0^c)\right)$$
   Where $f$ consists of 24 rounds of step permutations:
   $$f = \text{Rnd}_{24} = \iota \circ \chi \circ \pi \circ \rho \circ \theta$$
2. **Squeezing Phase**: The leading 256 bits of state $S$ form the immutable digest.

---

### 6.2 Deterministic Supply-Chain Canonical Data Hashing

Before broadcasting an audit event to `DisasterAudit.sol`, the backend generates a canonical JSON string $\mathcal{S}_{\text{canonical}}$ sorted by key:

$$\mathcal{S}_{\text{canonical}} = \operatorname{JSON.stringify}\left(\{ \text{data}, \text{entityId}, \text{entityType}, \text{eventType}, \text{referenceId} \}\right)$$

The on-chain 32-byte payload hash $H_{\text{data}} \in \mathbb{B}^{32}$ is computed as:

$$H_{\text{data}} = \operatorname{SHA-256}\left(\mathcal{S}_{\text{canonical}}\right) = \text{0x} \parallel \operatorname{Hex}\left( \sum_{i=1}^N \operatorname{SHA256}(M_i) \right)$$

---

### 6.3 secp256k1 Elliptic Curve Digital Signature Algorithm (ECDSA)

Ethereum smart contract transactions are signed by the government authority's private key $d \in [1, n-1]$ over the Koblitz curve **secp256k1**:

$$y^2 \equiv x^3 + ax + b \pmod p$$

Where curve parameters are defined over prime field $\mathbb{F}_p$:
* $p = 2^{256} - 2^{32} - 977 = \text{FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFF FFFFFFFE FFFFFC2F}$
* $a = 0$
* $b = 7$
* Base generator point $G = (G_x, G_y)$

The public verification address is derived from public key point $Q = d \cdot G$:

$$\text{Ethereum Address} = \operatorname{Last20Bytes}\left( \operatorname{Keccak-256}\left( Q_x \parallel Q_y \right) \right)$$

For transaction message hash $z = \operatorname{Keccak-256}(T_{\text{tx}})$, the ECDSA signature pair $(r, s)$ satisfies:

$$k \cdot G = (x_1, y_1), \quad r = x_1 \pmod n$$

$$s = k^{-1} \left( z + r \cdot d \right) \pmod n$$

---

### 6.4 State Trie Root & Block Mining Finality Equation

Transactions are packed into Ethereum blocks $B_k$. The block header commitment ensures that no past dispatch or delivery record can be rewritten without modifying the block hash:

$$H_{\text{block}} = \operatorname{Keccak-256}\left( \text{ParentHash} \parallel \text{StateRoot} \parallel \text{TxRoot} \parallel \text{ReceiptRoot} \parallel \text{Number} \parallel \text{Timestamp} \parallel \text{GasUsed} \right)$$

Where $\text{TxRoot}$ is the Merkle-Patricia Trie root:

$$\text{TxRoot} = \operatorname{TrieRoot}\left( \{ \operatorname{RLP}(i) \mapsto \operatorname{RLP}(\text{Transaction}_i) \}_{i=0}^{K-1} \right)$$

---

## 7. Comprehensive Model Inventory & Cross-Reference Catalog

The following master directory catalogues every model deployed in the NDMRAS codebase:

| Model Identifier | Classification | Mathematical Formalism | Implementation File | Key Hyperparameters / Config |
| :--- | :--- | :--- | :--- | :--- |
| **`disaster_random_forest.joblib`** | Supervised Machine Learning | Ensemble Decision Trees (Gini Split, Soft Voting) | `ml-service/app.py` | 400 trees, max_depth=20, 23 input features |
| **`kerala_flood_prediction_improved.pkl`** | Supervised ML Pipeline | Scikit-Learn ColumnTransformer + Balanced RF | `ml-service/train_improved_flood_model.py` | Time-split (2019/2021), 32 features, class_weight='balanced' |
| **`QAOA_STYLE_MULTI_WAREHOUSE`** | Quantum Computing | Variational Quantum Circuit ($H^{\otimes n}$, $R_z(2\gamma C)$, $R_x(2\beta)$) | `quantum/optimizer.py` | $\gamma=\frac{\pi}{4}$, $\beta=\frac{\pi}{4}$, 1,024 shots StatevectorSampler |
| **`CLASSICAL_KNAPSACK_BASELINE`** | Classical Combinatorial | Integer Linear Programming (Branch & Bound) | `quantum/optimizer.py` | Distance-weighted shortage minimization |
| **`sentinel-1-grd`** | Remote Sensing (Radar) | C-band SAR Backscatter Intensity ($\sigma^0_{\text{dB}}$) | `backend/src/services/satelliteService.js` | 10m resolution, VV/VH polarization, threshold < -14.5 dB |
| **`sentinel-2-l2a`** | Remote Sensing (Optical) | Bottom-Of-Atmosphere Radiometric Band Ratios (NDWI, MNDWI) | `backend/src/services/satelliteService.js` | 13 spectral bands, cloud threshold < 20%, 0.05° aperture |
| **`DisasterAudit.sol`** | Decentralized Governance | Solidity 0.8.20 EVM State Machine & Events | `blockchain/contracts/DisasterAudit.sol` | Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| **`TwoPhaseInventoryModel`** | Transactional Logistics | Constrained Atomic State Transitions ($U = \max(A - R, 0)$) | `backend/src/services/resourceAllocationService.js` | ACID InnoDB transactions with foreign key locks |
| **`HaversineGeodesic`** | Spherical Geodesy | Great-Circle Chord Trigonometry | `backend/src/services/quantumCandidateService.js` | Volumetric radius $R = 6371.0\text{ km}$ |
| **`DemographicExposure`** | Disaster Epidemiology | Piecewise Probability-Severity Scaling | `backend/src/services/livePredictionService.js` | Base populations: 5K (Low), 10K (Med), 25K (High), 50K (Crit) |

---
*End of Comprehensive Mathematical Models and Algorithmic Equations Compendium.*

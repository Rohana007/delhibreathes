# Microscopic Pollution Source Identification Engine - Documentation

## Overview

This engine implements microscopic pollution source identification using official government datasets and scientific formulas. It calculates the contribution of four major pollution sources: vehicular, industrial, construction, and biomass burning.

## Data Sources

### Official Static Data Files

All data files are located in `/data/` directory:

1. **VAHAN Processed Data** (`vahanProcessed.json`)
   - Source: VAHAN Open Data Portal (Ministry of Road Transport and Highways)
   - URL: https://vahan.parivahan.gov.in/vahan4dashboard/
   - Contains: Vehicle mix, fuel mix, age distribution
   - Used for: Vehicular pollution calculations

2. **CPCB Emission Factors** (`cpcbEmissionFactors.json`)
   - Source: Central Pollution Control Board Emission Factor Database
   - URL: https://cpcb.nic.in/emission-factors/
   - Reference: CPCB Emission Inventory Guidelines 2020
   - Contains: PM2.5, NOx, CO emission factors by vehicle type (g/km)
   - Used for: Vehicular pollution calculations

3. **Industrial Database** (`industrialDatabase.json`)
   - Source: Delhi Pollution Control Committee (DPCC) Industrial Database
   - URL: https://dpcc.delhi.gov.in/industries
   - Contains: Industry locations, categories, fuel types, stack heights
   - Used for: Industrial pollution calculations

4. **Construction Database** (`constructionDatabase.json`)
   - Source: DPCC Construction Site Registry
   - URL: https://dpcc.delhi.gov.in/construction-sites
   - Contains: Active construction sites with locations and areas
   - Used for: Construction dust calculations

5. **Validation Weights** (`validationWeights.json`)
   - Source: Internal calibration based on data source reliability
   - Contains: Confidence weights for different data sources
   - CPCB: 0.95 (highest - official government source)
   - NASA: 0.90 (high - scientific satellite data)
   - IMD: 0.88 (high - official weather data)
   - Traffic: 0.85 (moderate)
   - UserReports: 0.60 (lower - crowdsourced)

## Formulas and Calculations

### 1. Vehicular Pollution Engine

**Formula:**
```
For each vehicle type:
  contribution = typeShare × emissionFactor(type) × ageFactor × fuelFactor × 
                 congestionFactor × idlingFactor × roadTypeFactor × distanceDecay

vehicularScore = sum(all types) × validationWeight(CPCB)
```

**Age Factors:**
- 0-5 years: 1.0 (new vehicles)
- 5-10 years: 1.3 (moderate age)
- 10-15 years: 1.6 (older vehicles)
- 15+ years: 2.0 (very old vehicles)

**Fuel Factors:**
- Petrol: 1.0 (baseline)
- Diesel: 1.8 (higher emissions)
- CNG: 0.7 (lower emissions)
- Electric: 0.1 (minimal emissions)

**Diesel Signature Detection:**
```
dieselSignatureScore = (NO2_rise / (CO_rise + 0.01)) × baselineDieselRatio × 
                       congestionFactor × roadTypeFactor × timeFactor
```

**Distance Decay:**
```
distanceDecay(d_km) = 1 / (1 + 0.1 × d_km)
```

**Units:**
- Emission factors: g/km (grams per kilometer)
- Scores: Normalized contribution units
- Distance: kilometers

### 2. Industrial Pollution Engine

**Formula:**
```
industryScore = industryWeight × fuelFactor × stackDispersionFactor × 
                operatingHoursFactor × proximityFactor × validationWeight(CPCB)
```

**Fuel Factors:**
- Coal: 2.5
- Diesel: 1.8
- Natural Gas: 0.8
- Biomass: 1.5
- LPG: 0.9

**Category Weights:**
- Red: 2.0 (high pollution potential)
- Orange: 1.5 (moderate)
- Green: 0.8 (low)

**Stack Dispersion Factor:**
```
stackDispersionFactor = 1 / (1 + stackHeight_m / 50)
```
Higher stacks disperse better, reducing ground-level impact.

**Proximity Factor:**
Uses distance decay formula based on Haversine distance.

**Units:**
- Stack height: meters
- Distance: kilometers
- Operating hours: hours per day

### 3. Construction Dust Engine

**Formula:**
```
constructionScore = activeSiteCount × dustFactor × windFactor × 
                   drynessFactor × resuspensionFactor × validationWeight(Traffic)
```

**Wind Factor:**
- < 1 m/s: 0.5 (low wind, minimal dispersion)
- 1-3 m/s: 1.0 (moderate wind)
- 3-5 m/s: 1.5 (higher wind, more resuspension)
- > 5 m/s: 2.0 (strong wind, high resuspension)

**Dryness Factor (based on humidity):**
- < 30%: 1.5 (very dry)
- 30-50%: 1.2 (dry)
- 50-70%: 1.0 (moderate)
- > 70%: 0.5 (humid, less dust)

**Resuspension Factor:**
Combines traffic level and wind speed factors.

**Units:**
- Wind speed: m/s
- Humidity: percentage (0-100)
- Distance: kilometers

### 4. Biomass Burning Engine

**Formula:**
```
biomassScore = fireIntensity × materialFactor × frequency × 
               proximityFactor × validationWeight(NASA)
```

**Material Factors:**
- Agricultural: 1.5 (crop residue)
- Forest: 1.2 (forest fires)
- Waste: 1.8 (waste burning - higher PM2.5)

**Data Source:**
- Primary: NASA FIRMS satellite data (if available)
- Fallback: Mock data for demonstration
- URL: https://firms.modaps.eosdis.nasa.gov/

**Units:**
- Fire intensity: 0.0 to 1.0 (normalized)
- Distance: kilometers

## Geographic Calculations

### Haversine Distance Formula

Used to calculate distances between geographic points:

```
a = sin²(Δφ/2) + cos φ1 × cos φ2 × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- φ = latitude (radians)
- λ = longitude (radians)
- R = Earth's radius (6371 km)
- d = distance (km)

## Normalization and Confidence

### Contribution Normalization

Raw scores from all engines are normalized to percentages:

```
contribution[source] = (rawScore[source] / totalRawScore) × 100
```

If all scores are zero, equal distribution (25% each) is returned.

### Overall Confidence

Weighted average of individual source confidences:

```
overallConfidence = Σ(confidence[source] × score[source]) / Σ(score[source])
```

If no scores, simple average of confidences is used.

## Error Handling

All functions include:
- Input validation with safe defaults
- Try/catch blocks
- Graceful degradation
- Warning messages in response
- Never throws uncaught exceptions
- Always returns structured JSON

## API Endpoint

**GET** `/api/source-identification`

**Query Parameters:**
- `lat` (number, optional): Latitude (default: 28.6139 - Delhi center)
- `lng` (number, optional): Longitude (default: 77.2090 - Delhi center)
- `pm25`, `pm10`, `no2`, `co`, `so2` (number, optional): AQI values
- `windSpeed` (number, optional): Wind speed in m/s
- `windDirection` (number, optional): Wind direction in degrees
- `trafficLevel` (string, optional): 'free', 'moderate', 'heavy', 'jammed'
- `roadType` (string, optional): 'highway', 'major', 'minor', 'residential'
- `distance_km` (number, optional): Distance to nearest major road
- `humidity` (number, optional): Relative humidity 0-100

**Response:**
Always returns HTTP 200 with structured JSON containing:
- `vehicular`: { score, contributionPercent, confidence, reasoningText, policyActions, ... }
- `industrial`: { score, contributionPercent, confidence, reasoningText, policyActions, ... }
- `construction`: { score, contributionPercent, confidence, reasoningText, policyActions, ... }
- `biomass`: { score, contributionPercent, confidence, reasoningText, policyActions, ... }
- `summary`: { highest, overallConfidence, timestamp, location }
- `warnings`: Array of warning messages (if any)

## Validation and Citations

All calculations reference:
- **VAHAN**: Ministry of Road Transport and Highways, Government of India
- **CPCB**: Central Pollution Control Board, Ministry of Environment, Forest and Climate Change
- **DPCC**: Delhi Pollution Control Committee
- **NASA FIRMS**: NASA Earth Observing System Data and Information System
- **IMD**: India Meteorological Department, Ministry of Earth Sciences

## Security & Privacy

- No personal vehicle registration data is accessed or stored
- No individual owner information is used
- Only aggregated statistics and public official datasets are utilized
- All calculations are performed server-side


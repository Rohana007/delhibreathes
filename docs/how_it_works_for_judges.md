# How Microscopic Pollution Source Identification Works - For Judges

## Overview

This system identifies pollution sources at a microscopic level by analyzing official government datasets and applying scientific formulas. It calculates the contribution of four major pollution sources: vehicular emissions, industrial emissions, construction dust, and biomass burning.

## Data Sources

The system uses **processed official static data** from authoritative government sources:

1. **VAHAN** (Ministry of Road Transport and Highways): Vehicle registration statistics including vehicle mix (2W, 4W, LCV, HCV, Bus), fuel type distribution (Petrol, Diesel, CNG, Electric), and age distribution
   - URL: https://vahan.parivahan.gov.in/vahan4dashboard/

2. **CPCB** (Central Pollution Control Board): Official emission factors for different vehicle types (g/km)
   - URL: https://cpcb.nic.in/emission-factors/
   - Reference: CPCB Emission Inventory Guidelines 2020

3. **DPCC** (Delhi Pollution Control Committee): Industrial database with locations, categories, fuel types, and stack heights
   - URL: https://dpcc.delhi.gov.in/industries

4. **DPCC Construction Registry**: Active construction sites with locations and areas
   - URL: https://dpcc.delhi.gov.in/construction-sites

5. **NASA FIRMS**: Satellite-detected fire hotspots for biomass burning (optional live data)
   - URL: https://firms.modaps.eosdis.nasa.gov/

6. **IMD** (India Meteorological Department): Official weather data including wind speed, direction, temperature, humidity
   - URL: https://mausam.imd.gov.in/

## Microscopic Indicators

The system analyzes **microscopic indicators** that reveal pollution sources:

### Vehicular Pollution
- **Vehicle Mix**: Percentage of two-wheelers, four-wheelers, commercial vehicles
- **Age Distribution**: Older vehicles (15+ years) emit 2x more than new vehicles
- **Fuel Mix**: Diesel vehicles emit 1.8x more than petrol; CNG emits 0.7x; Electric emits 0.1x
- **Diesel Signature**: NO2/CO ratio indicates diesel contribution
- **Traffic Conditions**: Congestion and idling factors increase emissions

### Industrial Pollution
- **Industry Count**: Number of industries within search radius
- **Category Classification**: Red (high), Orange (moderate), Green (low) pollution potential
- **Stack Heights**: Higher stacks disperse better, reducing ground-level impact
- **Fuel Types**: Coal (2.5x), Diesel (1.8x), Natural Gas (0.8x) emission factors
- **Operating Hours**: 24-hour operations have higher impact

### Construction Dust
- **Active Site Count**: Number of active construction sites within 1 km radius
- **Dust Factor**: Based on site area and activity level
- **Wind Factor**: Higher wind speeds increase dust resuspension
- **Dryness Factor**: Drier conditions (low humidity) increase dust generation
- **Traffic Resuspension**: Heavy traffic resuspends settled dust

### Biomass Burning
- **Fire Hotspots**: Number of detected fires within 10 km radius
- **Fire Intensity**: Satellite-detected fire intensity (0.0 to 1.0)
- **Material Type**: Agricultural (1.5x), Waste (1.8x), Forest (1.2x) factors
- **Proximity**: Closer fires have higher impact

## Calculation Process

1. **Data Loading**: System loads official static data files (VAHAN, CPCB, DPCC)
2. **Proximity Analysis**: Calculates distances to pollution sources using Haversine formula
3. **Factor Application**: Applies age factors, fuel factors, weather factors, etc.
4. **Score Calculation**: Computes raw scores for each source using scientific formulas
5. **Normalization**: Converts raw scores to percentage contributions
6. **Confidence Calculation**: Weighted average confidence based on data availability
7. **Reasoning Generation**: Creates plain-language explanations referencing microscopic indicators

## Why This Output Can Drive Policy Actions

1. **Official Data Sources**: All calculations use authoritative government datasets (VAHAN, CPCB, DPCC), ensuring policy-makers can verify and trust the results

2. **Microscopic Precision**: Unlike aggregate pollution readings, this system identifies specific sources (e.g., "17% of vehicles are 15+ years old" or "3 active construction sites within 1 km"), enabling targeted interventions

3. **Actionable Recommendations**: The system generates specific policy actions for each source:
   - Vehicular: "Implement stricter emission standards for older vehicles"
   - Industrial: "Conduct emission audits for 3 industries within radius"
   - Construction: "Enforce dust control measures at active sites"
   - Biomass: "Monitor and control detected fire hotspots"

4. **Validation Weights**: Each data source has a confidence weight (CPCB: 0.95, NASA: 0.90, etc.), allowing policy-makers to assess reliability

5. **Reproducible Calculations**: All formulas, factors, and data sources are documented, allowing judges and policy-makers to reproduce and verify calculations

6. **Real-Time Adaptability**: System can incorporate live signals (NASA FIRMS, IMD weather) when available, or operate safely with static data alone

## Example Output Interpretation

If the system reports:
- **Vehicular: 45%** (Confidence: 85%)
  - Microscopic indicators: 38% two-wheelers, 17% vehicles 15+ years old, diesel signature score: 2.3
  - **Policy Action**: Focus on vehicle emission standards and promoting CNG/electric vehicles

- **Industrial: 25%** (Confidence: 80%)
  - Microscopic indicators: 2 industries within 5 km, both Red category, using Coal
  - **Policy Action**: Conduct emission audits and promote cleaner fuels

- **Construction: 20%** (Confidence: 75%)
  - Microscopic indicators: 2 active sites within 1 km, wind factor: 1.5, dryness factor: 1.2
  - **Policy Action**: Enforce dust control measures and restrict activities during high wind

- **Biomass: 10%** (Confidence: 60%)
  - Microscopic indicators: 1 fire hotspot within 10 km, agricultural material
  - **Policy Action**: Monitor fire and enforce crop residue burning ban

## Citations

- **VAHAN**: Ministry of Road Transport and Highways, Government of India
- **CPCB**: Central Pollution Control Board, Ministry of Environment, Forest and Climate Change
- **DPCC**: Delhi Pollution Control Committee
- **NASA FIRMS**: NASA Earth Observing System Data and Information System
- **IMD**: India Meteorological Department, Ministry of Earth Sciences

## Security & Privacy

- No personal vehicle or owner data is used or stored
- Only aggregated VAHAN statistics and public official datasets are utilized
- All calculations are performed server-side with no data transmission to third parties


# Data Sources Documentation

## Overview

This directory contains **processed official static data** derived from authoritative government and scientific sources. These datasets are used by the Microscopic Pollution Source Identification engine to calculate pollution source contributions.

## Official Data Sources

### 1. VAHAN Vehicle Registration Data
- **Source**: VAHAN Open Data Portal
- **URL**: https://vahan.parivahan.gov.in/vahan4dashboard/
- **Description**: Aggregated vehicle registration statistics including vehicle mix (2W, 3W, 4W, LCV, HCV, Bus), fuel type distribution (Petrol, Diesel, CNG, Electric), and age distribution
- **File**: `vahanProcessed.json`
- **Usage**: Used in vehicular pollution source identification
- **Privacy Note**: No personal vehicle or owner data is used; only aggregated statistics

### 2. CPCB Emission Factors
- **Source**: Central Pollution Control Board (CPCB) Emission Factor Database
- **URL**: https://cpcb.nic.in/emission-factors/
- **Reference Document**: CPCB Emission Inventory Guidelines 2020
- **Description**: Official emission factors (g/km) for PM2.5, NOx, CO by vehicle type
- **File**: `cpcbEmissionFactors.json`
- **Usage**: Core emission factors for vehicular source calculations
- **Units**: g/km (grams per kilometer)

### 3. DPCC Industrial Database
- **Source**: Delhi Pollution Control Committee (DPCC) Industrial Database
- **URL**: https://dpcc.delhi.gov.in/industries
- **Description**: Registered industries in Delhi NCR with emission characteristics, stack heights, fuel types, and operating hours
- **File**: `industrialDatabase.json`
- **Usage**: Industrial pollution source identification and proximity calculations
- **Categories**: Red, Orange, Green (based on pollution potential)

### 4. DPCC Construction Site Database
- **Source**: Delhi Pollution Control Committee (DPCC) Construction Site Registry
- **URL**: https://dpcc.delhi.gov.in/construction-sites
- **Description**: Active construction sites with location, area, and activity status
- **File**: `constructionDatabase.json`
- **Usage**: Construction dust source identification within configurable radius

### 5. NASA FIRMS Fire Data
- **Source**: NASA Fire Information for Resource Management System (FIRMS)
- **URL**: https://firms.modaps.eosdis.nasa.gov/
- **Description**: Satellite-detected fire hotspots for biomass burning identification
- **Usage**: Optional live signal (if API key available) or hourly-updated file
- **Fallback**: Safe mock data if live data unavailable
- **Validation Weight**: 0.90 (high reliability)

### 6. IMD Weather Data
- **Source**: India Meteorological Department (IMD)
- **URL**: https://mausam.imd.gov.in/
- **Description**: Official weather data including wind speed, wind direction, temperature, humidity
- **Usage**: Wind factor calculations for dispersion modeling
- **Validation Weight**: 0.88 (high reliability)

### 7. Validation Weights
- **Source**: Internal calibration based on data source reliability
- **File**: `validationWeights.json`
- **Description**: Confidence weights for different data sources used in final calculations
- **Rationale**: Higher weights for official government sources (CPCB, IMD), moderate for scientific sources (NASA), lower for crowdsourced data

## Data Processing Notes

- All data files are **processed and aggregated** from official sources
- No raw personal or sensitive data is stored
- All coordinates are approximate and used for proximity calculations only
- Emission factors are based on official CPCB standards
- Vehicle statistics are aggregated regional averages

## Updates

- Static data files are updated periodically from official sources
- Live signals (NASA FIRMS, IMD) are optional and used when available
- System operates safely with static data alone if live APIs are unavailable

## Citation for Judges

When demonstrating this system, cite:
- **VAHAN**: Ministry of Road Transport and Highways, Government of India
- **CPCB**: Central Pollution Control Board, Ministry of Environment, Forest and Climate Change
- **DPCC**: Delhi Pollution Control Committee
- **NASA FIRMS**: NASA Earth Observing System Data and Information System
- **IMD**: India Meteorological Department, Ministry of Earth Sciences

## Security & Privacy

- No personal vehicle registration data is accessed or stored
- No individual owner information is used
- Only aggregated statistics and public official datasets are utilized
- All calculations are performed server-side with no data transmission to third parties


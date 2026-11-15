# Data sources

## JPL Horizons

- API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- System manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Service endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
- Targets: Sun (10) and Earth center (399).
- Observer: user-defined Moon surface geodetic point (`coord@301`, `COORD_TYPE=GEODETIC`, `SITE_COORD=east longitude, latitude, altitude km`).
- Output: observer ephemeris, apparent airless azimuth/elevation (quantity 4), angular diameter (quantity 13), and observer range (quantity 20), with UT times, ICRF reference system, and kilometer range units.

Horizons is a public NASA/JPL service. The app makes no authenticated requests and stores no credentials. Its response is cached in server memory for five minutes; this cache is instance-local and is not durable.

## Reference location coordinates

The interface calls these **reference locations**, not NASA's current mission shortlist. They are six historical south-polar feature centers from the 2023 Lunar Surface Data Book. They are not landing ellipses, and the labels should not be read as current Artemis candidate sites. NASA's October 2024 Artemis III shortlist named nine regions: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, and Slater Plain. NASA's 2026 Artemis architecture update assigns Artemis III an Earth-orbit demonstration and Artemis IV the first planned lunar landing, so that 2024 list should itself be treated as historical mission context rather than a current LUNA NAV target list.

References: [NASA's 2024 landing-region update](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/); [NASA's Artemis III updates](https://www.nasa.gov/artemis-iii-news-and-updates/); [NASA's November 2026 Artemis architecture update](https://www.nasa.gov/missions/artemis/nasa-shares-plans-to-accelerate-artemis-return-to-moon/).

NASA, *Lunar Surface Data Book*, ACD-50044 Revision A, Table A2-2 (May 19, 2023), feature-center coordinates generated from DEM files. Table entries used:

| Feature center | Latitude | Table longitude | Reference shorthand |
|---|---:|---:|---|
| Connecting Ridge | -89.4632° | -137.4900° | Site01 / R01 |
| Shackleton Rim | -89.7668° | -171.8700° | Site04 / R04 |
| Peak near Shackleton | -88.8110° | 123.6901° | Site07 / R07 |
| de Gerlache Rim 1 | -88.6834° | -67.9321° | Site11 / R11 |
| Leibnitz Beta Plateau | -85.4266° | 31.74276° | Site20 / R20 |
| Malapert Massif | -85.9948° | -0.23578° | Site23 / R23 |

Reference PDF: https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf. The table's signed longitude values are normalized into 0–360° east-positive longitude for Horizons and retained in signed form for display. Coordinates are reference points and do not establish local slope, illumination, safety, resource access, or landing suitability.

## LOLA terrain

- PGDA high-resolution south-pole site products: https://pgda.gsfc.nasa.gov/products/78
- PGDA south-pole LOLA DEM mosaic: https://pgda.gsfc.nasa.gov/products/81

The PGDA product description reports 5 m/pixel GeoTIFFs in south-polar stereographic X/Y coordinates, Moon ME reference frame (DE421). No DEM is downloaded, redistributed, or processed by this application. No terrain obstruction result is presented.

## Usage and attribution

NASA/JPL and PGDA source data are attributed for scientific identification. Check source product metadata and NASA/JPL/PGDA usage terms before redistributing source datasets or derived products. LUNA NAV is an independent screening application and is not an official NASA product.

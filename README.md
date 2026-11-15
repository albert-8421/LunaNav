# LUNA NAV

**Lunar Navigation, Illumination & Communication Analysis**

LUNA NAV is a lunar south-pole mission-planning demonstrator for comparing where and when Sun illumination and Earth line of sight may be available. It combines lunar-surface observer ephemerides, an interactive sky view, sampled visibility analysis, and side-by-side site/date scenarios.

> LUNA NAV is a screening and educational tool. It is not flight software, a certified landing-site assessment, a terrain-clearance analysis, or a communications link-budget tool.

## Features

- **Six historical reference locations** from NASA's 2023 Lunar Surface Data Book, plus custom selenographic coordinates. These are feature centers, not current NASA landing ellipses or a current mission shortlist.
- **Date and time controls** accept browser-local time and convert it to UTC for the JPL Horizons request.
- **JPL Horizons mode** requests topocentric apparent Sun and Earth directions from the selected location on the Moon. The server route validates and caches requests and reports upstream failures without silently changing to demo values.
- **Illustrative demo mode** keeps the interface usable without network access. Demo ephemerides are clearly labeled and are not physical predictions.
- **Celestial sky views** show azimuth/elevation and distinguish above- and below-horizon directions.
- **Solar and Earth screening** reports sampled elevation, geometric visibility intervals, Earth-center line of sight, and Earth-disk visibility where angular-diameter data is available.
- **Three-scenario comparison** supports independent site, date, and evaluation-window choices without a weighted score or opaque site recommendation.
- **Interactive views** include a procedural lunar globe and a generic terrain concept. Neither is a real map or LOLA elevation product.

## Technology

- Next.js App Router and React
- TypeScript
- Tailwind CSS 4 with PostCSS
- Recharts
- Three.js for the interactive 3D views; SVG/CSS for the 2D sky visualization
- JPL Horizons accessed through a Next.js server route
- JSON-compatible TypeScript site metadata; no database or authentication

## Requirements

- Node.js compatible with the installed Next.js 16 release
- npm

No API key or environment variables are required for the public JPL Horizons endpoint.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode is selected initially. Choose **JPL real** to request live Horizons data. If that service is unavailable, the interface shows the error and keeps real-data metrics unavailable; select demo mode explicitly to see illustrative samples.

## Checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Run the production build locally with:

```bash
npm run start
```

## Data and scientific scope

The Horizons route requests the Sun and Earth from a lunar surface observer using the Moon-centered coordinate location and airless apparent observer quantities described in the [JPL Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html). See [SCIENTIFIC_METHODOLOGY.md](./SCIENTIFIC_METHODOLOGY.md) for conventions and calculations.

Site reference coordinates are documented in NASA's [Lunar Surface Data Book, Revision A](https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf). NASA's [Artemis III landing-region update](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/) provides additional date-qualified mission context.

NASA's [LOLA south-pole elevation products](https://pgda.gsfc.nasa.gov/products/78) are identified as a future terrain-analysis source, but no LOLA raster is currently ingested. Terrain obstruction, site slope, landing clearance, local horizon profiles, and terrain shadows are not calculated. The 3D surface concept is generic procedural relief; its lighting is not driven by the selected Sun direction. Earth visibility is not a verified communications link, and solar elevation is not a power-generation estimate.

Read [DATA_SOURCES.md](./DATA_SOURCES.md) for source details and [ASSUMPTIONS_AND_LIMITATIONS.md](./ASSUMPTIONS_AND_LIMITATIONS.md) for the full limitations list. No third-party raster data is bundled with this project.

## Deployment

The project is compatible with standard Next.js hosting, including Vercel. The /api/ephemeris route calls the public JPL Horizons API server-side. Horizons availability and rate limits can affect live requests; its in-memory cache is per running server instance.

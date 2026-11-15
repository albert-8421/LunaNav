# Assumptions and limitations

- Real celestial positions are retrieved from JPL Horizons on demand. If the service is unavailable, the app reports an error and does not silently substitute demo values.
- Demo ephemeris is illustrative, deterministic sample data. Its appearance does not imply physical accuracy.
- The six selectable locations are historical feature centers from NASA's 2023 Lunar Surface Data Book, not NASA's current mission shortlist, certified landing ellipses, or high-resolution operational touchdown coordinates.
- Horizons site altitude is set to 0 km relative to its lunar reference surface.
- Sunlight and Earth-center line-of-sight durations use a 0° geometric horizon, with linear interpolation between discrete ephemeris samples. Duration accuracy is limited by the selected time step and the linear-between-samples assumption.
- Earth disk visibility is calculated separately from center line-of-sight using Horizons apparent angular diameter when every sample includes it. It is unavailable when those diameter samples are missing. Neither measure proves a communications link.
- LOLA data is identified as a future terrain-analysis source, but no elevation raster is currently ingested. Terrain-corrected horizon, obstruction, or slope claims are not available.
- The 3D surface view is a generic procedural concept, not terrain at the selected coordinates. Its light is illustrative and is not driven by the Sun direction; the Sun marker indicates direction only.
- Real mode requests Earth apparent angular diameter from Horizons. Earth elevation/azimuth and visible-disk results are not validated communication windows: no link budget, antenna pattern, spacecraft relay, occultation, or terrain clearance analysis is included.
- Solar elevation is a screening input, not electrical power output. Panel orientation, efficiency, degradation, thermal state, and local relief are outside the model.
- Scenario comparison reports separate measures and does not compute a weighted score or scientific recommendation.
- Demo values are an interface illustration only. They are deterministic but are not a physical ephemeris and do not vary with lunar longitude in a validated way.
- The implementation is a demonstrator and is not flight software or mission certification evidence.

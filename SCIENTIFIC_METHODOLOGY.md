# Scientific methodology

## Ephemeris requests

The server route requests one Horizons observer ephemeris for the Sun (target 10) and one for Earth (399), relative to the same user-defined location on the Moon. `CENTER=coord@301` anchors the coordinate observer to the Moon's body center. `SITE_COORD` uses geodetic east longitude, latitude, and zero-kilometer altitude. Horizons observer quantity 4 supplies apparent azimuth/elevation, quantity 13 target angular diameter, and quantity 20 observer range. Times are requested as UT, the reference system is ICRF, range units are kilometers, and `APPARENT=AIRLESS` requests airless apparent directions without terrestrial atmospheric refraction. The 360° sky plot maps azimuth clockwise from north and elevation from the geometric horizon to zenith. Below-horizon body centers are drawn on the horizon rim to retain their azimuth.

Signed user/site longitude is normalized to `[0,360)` east longitude before it is passed to Horizons. Dates selected in the browser are interpreted in local browser time by the `datetime-local` control and converted to UTC ISO timestamps before the request. The returned `UT` timestamps are displayed as UTC.

The API route validates geographic bounds, ISO timestamps with a time zone, a maximum 14-day window, integer hours, and supported 1–24 hour sample spacings. It makes two upstream requests in parallel, requires identical Sun/Earth timestamps in ascending order, and returns an explicit error if either request or the sample pairing fails. The route caches complete requests for five minutes per running process and bounds its in-memory cache.

## Visibility and durations

Solar visibility and Earth-center line-of-sight duration use apparent center elevation greater than or equal to 0°. For Earth disk status and disk-visible duration, the returned full angular diameter is used: any part of the disk is visible when center elevation plus angular radius is at least 0°; the disk is fully clear when center elevation is at least its angular radius. If any Earth diameter sample is absent, disk-visible duration is shown as unavailable rather than inferred. These calculations exclude terrain, antenna masking, atmospheric refraction, occultation by nearby relief, and radio link budget. Durations and interval endpoints linearly interpolate each sample pair across a threshold crossing; they estimate duration between samples but do not capture finer orbital changes. The timeline's colored strips show sampled states, so their boundaries are quantized to the selected sample interval.

Maximum elevation is the maximum sampled value. Average visible solar elevation is the arithmetic mean over samples at or above the geometric horizon (samples are uniformly spaced in Horizons). If there are no samples, metrics are unknown; if the Sun never clears the horizon, average visible solar elevation is unavailable. Sample spacing should be reduced when a more detailed screening pass is desired.

The illustrative demo generator is deterministic and is used only in visibly labeled demo mode. It is not an ephemeris model and must not be used to make mission decisions.

## Interactive 3D views

The globe's candidate markers use the supplied selenographic coordinates with east-positive longitude: longitude 0° points along +Z, east longitude toward +X, and north latitude toward +Y. The South Pole and 80°S latitude circle are visual references. The globe surface, crater texture, and generic surface-concept mesh are procedural illustrations, not LOLA imagery, site-specific topography, or elevation measurements. The concept surface is not georeferenced, its lighting is not driven by the Sun sample, and no local horizon, terrain obstruction, or terrain shadow is calculated from it.

The local surface and celestial views use an east-up-north frame (+X east, +Y up, +Z north); azimuth is clockwise from north. Sun and Earth directions in both views follow the selected time sample. In real mode those directions come from the returned JPL Horizons apparent azimuth/elevation; in demo mode they come from the explicitly labeled deterministic illustrative series. The 3D body markers are symbols for direction and are not to angular scale.

## Scenario comparison

The UI reports separate durations and elevations for each site/date window and provides no weighted score, arbitrary threshold band, or recommended site. These figures support comparison only; they do not account for power-system design, communications architecture, terrain, mission constraints, or uncertainty.

## Independent validation

The observer configuration is based on the official Horizons API documentation and manual descriptions of `coord@body`, geodetic `SITE_COORD`, observer tables, quantity 4, quantity 13, and quantity 20. A captured Horizons observer row is used as a parser regression fixture, but a live full-window Sun/Earth comparison against an independent ephemeris reference is not automated.

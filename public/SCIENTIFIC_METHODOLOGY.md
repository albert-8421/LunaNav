# Scientific methodology

## Ephemeris requests

The server route requests one Horizons observer ephemeris for the Sun (target 10) and one for Earth (399), relative to the same user-defined location on the Moon. `CENTER=coord@301` anchors the coordinate observer to the Moon's body center. `SITE_COORD` uses geodetic east longitude, latitude, and zero-kilometer altitude. Horizons observer quantity 4 supplies apparent azimuth/elevation, quantity 13 angular diameter, and quantity 20 observer range. Times are requested and labeled UT, the reference system is ICRF, range units are kilometers, and `APPARENT=AIRLESS` avoids terrestrial atmospheric refraction. The spherical sky plot treats the returned azimuth as clockwise from north and clips below-horizon points to the horizon rim.

Signed user/site longitude is normalized to `[0,360)` east longitude before it is passed to Horizons. Dates selected in the browser are interpreted in local browser time by the `datetime-local` control and converted to UTC ISO timestamps before the request. The returned `UT` timestamps are displayed as UTC.

The API route validates geographic bounds, a maximum 14-day window, and supported 1–24 hour sample spacings. It makes two upstream requests in parallel and returns an explicit error if either fails. The route caches complete requests for five minutes per running process.

## Visibility and durations

Solar visibility and Earth-center line-of-sight duration use apparent elevation greater than or equal to 0°. For Earth disk status only, the measured apparent angular diameter is used: the full disk clears the horizon when center elevation is at least its angular radius; partial disk visibility is reported when the upper limb clears 0° while the center remains below. Duration metrics still use Earth-center visibility. These calculations exclude terrain, antenna masking, atmospheric refraction, occultation by nearby relief, and radio link budget. The app integrates each pair of samples linearly across the 0° crossing; this estimates duration between samples but does not capture finer orbital changes. The displayed intervals span the first and last visible samples and are not sub-sample interpolations.

Maximum elevation is the maximum sampled value. Average visible solar elevation is the arithmetic mean over samples at or above the geometric horizon. Continuous intervals are formed from contiguous visible samples. Sample spacing should be reduced when a more detailed screening pass is desired.

The illustrative demo generator is deterministic and is used only in visibly labeled demo mode. It is not an ephemeris model and must not be used to make mission decisions.

## Scenario labels

The UI provides transparent sunlight screening bands (>30 h favourable, >15 h moderate, otherwise challenging) within each selected evaluation window. These thresholds are interface heuristics for comparison, not scientifically validated operational criteria. They do not combine sunlight and communications into a weighted mission score and do not produce a recommended landing site.

## Independent validation

The observer configuration is based on the official Horizons API and manual descriptions of `coord@body`, geodetic `SITE_COORD`, observer tables, quantity 4, and quantity 9. Automated live reference-output regression fixtures have not been included; service output parsing must be checked against a current Horizons response when the API is reachable.

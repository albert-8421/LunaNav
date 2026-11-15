import { describe, expect, it } from "vitest";
import { SITES } from "../data/sites";
import { demoEphemeris } from "./science";
import { azimuthElevationToEnu, pointAtIndex, selenographicToGlobe } from "./lunarCoordinates";

const closeTo = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe("3D lunar coordinate mappings", () => {
  it("maps poles, prime meridian and east longitude consistently", () => {
    const north = selenographicToGlobe(90, 0);
    const south = selenographicToGlobe(-90, 0);
    const primeMeridian = selenographicToGlobe(0, 0);
    closeTo(north.y, 1);
    closeTo(south.y, -1);
    closeTo(primeMeridian.z, 1);
    closeTo(selenographicToGlobe(0, 90).x, 1);
  });

  it("places every existing landing-site marker at its verified coordinates", () => {
    for (const site of SITES) {
      const marker = selenographicToGlobe(site.latitude, site.longitude, 1.5);
      closeTo(Math.hypot(marker.x, marker.y, marker.z), 1.5);
      expect([marker.x, marker.y, marker.z].every(Number.isFinite)).toBe(true);
    }
  });

  it("maps JPL azimuth and elevation into local east-up-north coordinates", () => {
    expect(azimuthElevationToEnu(0, 0)).toEqual({ x: 0, y: 0, z: 1 });
    closeTo(azimuthElevationToEnu(90, 0).x, 1);
    closeTo(azimuthElevationToEnu(0, 90).y, 1);
    const vector = azimuthElevationToEnu(135, 22);
    closeTo(Math.hypot(vector.x, vector.y, vector.z), 1);
  });

  it("keeps timeline selection clamped to the shared ephemeris samples", () => {
    const points = demoEphemeris("2026-11-15T00:00:00Z", 6, 0, 2);
    expect(pointAtIndex(points, 0)).toBe(points[0]);
    expect(pointAtIndex(points, 2)).toBe(points[2]);
    expect(pointAtIndex(points, 999)).toBe(points.at(-1));
    expect(pointAtIndex(points, -1)).toBe(points[0]);
    expect(pointAtIndex([], 0)).toBeUndefined();
  });
});

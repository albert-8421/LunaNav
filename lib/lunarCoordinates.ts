import type { EphemerisPoint } from "@/lib/science";

export type Vec3 = { x: number; y: number; z: number };

/**
 * Selenographic east-positive convention mapped onto a Y-up Three.js sphere:
 * longitude 0° points +Z, east (+longitude) points +X, and north points +Y.
 */
export function selenographicToGlobe(latitude: number, eastLongitude: number, radius = 1): Vec3 {
  const lat = (latitude * Math.PI) / 180;
  const lon = (eastLongitude * Math.PI) / 180;
  return {
    x: radius * Math.cos(lat) * Math.sin(lon),
    y: radius * Math.sin(lat),
    z: radius * Math.cos(lat) * Math.cos(lon),
  };
}

/** Local ENU mapping: +X east, +Y up, +Z north; azimuth is clockwise from north. */
export function azimuthElevationToEnu(azimuthDeg: number, elevationDeg: number, radius = 1): Vec3 {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  const horizontal = Math.cos(el) * radius;
  return {
    x: horizontal * Math.sin(az),
    y: radius * Math.sin(el),
    z: horizontal * Math.cos(az),
  };
}

export function pointAtIndex(points: readonly EphemerisPoint[], index: number): EphemerisPoint | undefined {
  if (points.length === 0) return undefined;
  const safeIndex = Math.max(0, Math.min(points.length - 1, Math.trunc(index)));
  return points[safeIndex];
}

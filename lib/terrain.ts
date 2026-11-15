import { normalizeAzimuth } from "./science";

/** A horizon profile must be derived from a cited, site-matched elevation raster. */
export type TerrainHorizonProfile = {
  sourceName: string;
  sourceUrl: string;
  siteLatitude: number;
  siteLongitudeEast: number;
  azimuthStepDeg: number;
  obstructionElevationDeg: number[];
};

/** Returns null when no usable real profile is supplied; no terrain is inferred. */
export function obstructionAt(azimuthDeg: number, profile: TerrainHorizonProfile | null): number | null {
  if (!profile || !profile.sourceName || !profile.sourceUrl || !Number.isFinite(profile.siteLatitude) || profile.siteLatitude < -90 || profile.siteLatitude > 90 || !Number.isFinite(profile.siteLongitudeEast) || !Number.isFinite(azimuthDeg) || !Number.isFinite(profile.azimuthStepDeg) || profile.azimuthStepDeg <= 0 || profile.obstructionElevationDeg.length < 2 || Math.abs(profile.azimuthStepDeg * profile.obstructionElevationDeg.length - 360) > 1e-6) return null;
  const bins = profile.obstructionElevationDeg;
  if (bins.some(v => !Number.isFinite(v) || v < -90 || v > 90)) return null;
  const pos = normalizeAzimuth(azimuthDeg) / profile.azimuthStepDeg;
  const lower = Math.floor(pos), fraction = pos - lower;
  const a = bins[lower % bins.length], b = bins[(lower + 1) % bins.length];
  return a + (b - a) * fraction;
}

/** Terrain-corrected clear line of sight; null explicitly means no terrain result. */
export function terrainVisible(azimuthDeg: number, elevationDeg: number, profile: TerrainHorizonProfile | null): boolean | null {
  const obstruction = obstructionAt(azimuthDeg, profile);
  return obstruction === null ? null : elevationDeg >= obstruction;
}

export type EphemerisPoint = { time: string; sunAz: number; sunEl: number; earthAz: number; earthEl: number; sunRangeKm?: number; earthRangeKm?: number; sunAngularDiameterArcsec?: number; earthAngularDiameterArcsec?: number; source: "JPL Horizons" | "Illustrative demo" };
export type Interval = { start: string; end: string; durationHours: number };
export type ScienceMetrics = {
  sunlightHours: number | null;
  earthCenterLosHours: number | null;
  earthDiskVisibleHours: number | null;
  maxSun: number | null;
  avgVisibleSun: number | null;
  maxEarth: number | null;
  sunIntervals: Interval[];
  earthCenterIntervals: Interval[];
  earthDiskIntervals: Interval[] | null;
};
export const normalizeAzimuth = (deg: number) => ((deg % 360) + 360) % 360;
const interpolateAngle = (from: number, to: number, fraction: number) => normalizeAzimuth(from + (((to - from + 540) % 360) - 180) * fraction);

/** Linearly interpolates adjacent JPL/demo samples for smooth display animation only. */
export function interpolateEphemeris(points: readonly EphemerisPoint[], sampleIndex: number): EphemerisPoint | undefined {
  if (!points.length) return undefined;
  const index = Math.max(0, Math.min(points.length - 1, sampleIndex));
  const before = Math.floor(index);
  const after = Math.min(points.length - 1, before + 1);
  const fraction = index - before;
  const a = points[before], b = points[after];
  const mix = (x: number, y: number) => x + (y - x) * fraction;
  const mixOptional = (x?: number, y?: number) => x === undefined || y === undefined ? x ?? y : mix(x, y);
  return {
    time: new Date(Date.parse(a.time) + (Date.parse(b.time) - Date.parse(a.time)) * fraction).toISOString(),
    sunAz: interpolateAngle(a.sunAz, b.sunAz, fraction),
    sunEl: mix(a.sunEl, b.sunEl),
    earthAz: interpolateAngle(a.earthAz, b.earthAz, fraction),
    earthEl: mix(a.earthEl, b.earthEl),
    sunRangeKm: mixOptional(a.sunRangeKm, b.sunRangeKm),
    earthRangeKm: mixOptional(a.earthRangeKm, b.earthRangeKm),
    sunAngularDiameterArcsec: mixOptional(a.sunAngularDiameterArcsec, b.sunAngularDiameterArcsec),
    earthAngularDiameterArcsec: mixOptional(a.earthAngularDiameterArcsec, b.earthAngularDiameterArcsec),
    source: a.source,
  };
}

export function visibilityIntervals(points: EphemerisPoint[], elevation: (p: EphemerisPoint) => number, threshold = 0): Interval[] {
  if (!points.length) return [];
  const crossing = (a: EphemerisPoint, b: EphemerisPoint) => {
    const first = elevation(a) - threshold, second = elevation(b) - threshold;
    if (first === second) return Date.parse(b.time);
    const fraction = Math.max(0, Math.min(1, -first / (second - first)));
    return Date.parse(a.time) + (Date.parse(b.time) - Date.parse(a.time)) * fraction;
  };
  const asIso = (time: number) => new Date(time).toISOString();
  const intervals: Interval[] = [];
  let start: number | null = elevation(points[0]) >= threshold ? Date.parse(points[0].time) : null;
  for (let i = 1; i < points.length; i += 1) {
    const before = elevation(points[i - 1]) >= threshold;
    const after = elevation(points[i]) >= threshold;
    if (!before && after) start = crossing(points[i - 1], points[i]);
    if (before && !after && start !== null) {
      const end = crossing(points[i - 1], points[i]);
      intervals.push({ start: asIso(start), end: asIso(end), durationHours: Math.max(0, (end - start) / 3_600_000) });
      start = null;
    }
  }
  if (start !== null) {
    const end = Date.parse(points[points.length - 1].time);
    intervals.push({ start: asIso(start), end: asIso(end), durationHours: Math.max(0, (end - start) / 3_600_000) });
  }
  return intervals;
}
export function metrics(points: EphemerisPoint[]): ScienceMetrics {
  if (!points.length) return { sunlightHours: null, earthCenterLosHours: null, earthDiskVisibleHours: null, maxSun: null, avgVisibleSun: null, maxEarth: null, sunIntervals: [], earthCenterIntervals: [], earthDiskIntervals: null };
  const sun = points.filter(p => p.sunEl >= 0);
  const sunIntervals = visibilityIntervals(points, p => p.sunEl);
  const earthCenterIntervals = visibilityIntervals(points, p => p.earthEl);
  const hasEarthDiameter = points.every(p => Number.isFinite(p.earthAngularDiameterArcsec) && (p.earthAngularDiameterArcsec ?? 0) > 0);
  const earthDiskIntervals = hasEarthDiameter
    ? visibilityIntervals(points, p => p.earthEl + (p.earthAngularDiameterArcsec ?? 0) / 7200)
    : null;
  const sumHours = (intervals: Interval[]) => intervals.reduce((total, interval) => total + interval.durationHours, 0);
  return {
    sunlightHours: sumHours(sunIntervals),
    earthCenterLosHours: sumHours(earthCenterIntervals),
    earthDiskVisibleHours: earthDiskIntervals ? sumHours(earthDiskIntervals) : null,
    maxSun: Math.max(...points.map(p => p.sunEl)),
    avgVisibleSun: sun.length ? sun.reduce((sum, p) => sum + p.sunEl, 0) / sun.length : null,
    maxEarth: Math.max(...points.map(p => p.earthEl)),
    sunIntervals,
    earthCenterIntervals,
    earthDiskIntervals,
  };
}
export function demoEphemeris(start: string, hours: number, siteIndex = 0, stepHours = 2): EphemerisPoint[] {
  const startMs = Date.parse(start), phase = siteIndex * 0.72;
  return Array.from({ length: Math.floor(hours / stepHours) + 1 }, (_, i) => {
    const t = i * stepHours, theta = (2 * Math.PI * t / 708.7) + phase;
    return { time: new Date(startMs + t * 3_600_000).toISOString(), sunAz: normalizeAzimuth(15 + t * 0.51 + siteIndex * 19), sunEl: 4 + 8 * Math.sin(theta) + siteIndex * 0.6, earthAz: normalizeAzimuth(175 + siteIndex * 11 + Math.sin(t / 240) * 5), earthEl: 5 + 4 * Math.sin(t / 520 + phase), source: "Illustrative demo" };
  });
}

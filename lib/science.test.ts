import { describe, expect, it } from "vitest";
import { interpolateEphemeris, metrics, normalizeAzimuth, visibilityIntervals, type EphemerisPoint } from "./science";
import { obstructionAt, terrainVisible, type TerrainHorizonProfile } from "./terrain";
const pts = (els: number[]) => els.map((sunEl, i) => ({ time: new Date(Date.UTC(2026,0,1,i)).toISOString(), sunEl, sunAz: 0, earthEl: 1, earthAz: 0, source: "Illustrative demo" as const } satisfies EphemerisPoint));
describe("lunar visibility calculations", () => {
  it("normalizes azimuth", () => { expect(normalizeAzimuth(-10)).toBe(350); expect(normalizeAzimuth(721)).toBe(1); });
  it("interpolates visibility interval boundaries between samples", () => {
    const intervals=visibilityIntervals(pts([-1,1,1,-1,2]),p=>p.sunEl);
    expect(intervals).toHaveLength(2);
    expect(intervals[0].start).toBe(new Date(Date.UTC(2026,0,1,0,30)).toISOString());
    expect(intervals[0].end).toBe(new Date(Date.UTC(2026,0,1,2,30)).toISOString());
    expect(intervals[0].durationHours).toBe(2);
    expect(intervals[1].start).toBe(new Date(Date.UTC(2026,0,1,3,20)).toISOString());
    expect(intervals[1].durationHours).toBeCloseTo(2/3);
  });
  it("uses a terrain/screening threshold", () => { expect(visibilityIntervals(pts([1,2,3]), p=>p.sunEl, 2).length).toBe(1); });
  it("linearly estimates durations between horizon crossings", () => { expect(metrics(pts([-2,2,-2])).sunlightHours).toBe(1); });
  it("keeps no-data metrics unknown instead of reporting zero",()=>{
    expect(metrics([])).toMatchObject({sunlightHours:null,earthCenterLosHours:null,earthDiskVisibleHours:null,maxSun:null,avgVisibleSun:null,maxEarth:null});
  });
  it("distinguishes Earth-center line of sight from apparent disk visibility",()=>{
    const samples=pts([-1,1]).map(p=>({...p,earthEl:p.sunEl,earthAngularDiameterArcsec:7200}));
    expect(metrics(samples).earthCenterLosHours).toBe(0.5);
    expect(metrics(samples).earthDiskVisibleHours).toBe(1);
  });
  it("does not infer Earth disk duration when diameter samples are absent",()=>{
    expect(metrics(pts([-1,1])).earthDiskVisibleHours).toBeNull();
  });
  it("smoothly interpolates the shared ephemeris without taking the long azimuth path", () => {
    const samples = [
      { ...pts([0])[0], sunAz: 359, earthAz: 1 },
      { ...pts([2])[0], time: new Date(Date.UTC(2026,0,1,1)).toISOString(), sunAz: 1, earthAz: 359 },
    ];
    const middle = interpolateEphemeris(samples, 0.5)!;
    expect(middle.sunAz).toBe(0);
    expect(middle.earthAz).toBe(0);
    expect(middle.sunEl).toBe(1);
    expect(middle.time).toBe(new Date(Date.UTC(2026,0,1,0,30)).toISOString());
  });
  it("fails closed when no LOLA profile exists and interpolates cited profiles", () => {
    const profile:TerrainHorizonProfile={sourceName:"LOLA test fixture",sourceUrl:"https://pgda.gsfc.nasa.gov/products/78",siteLatitude:-89,siteLongitudeEast:0,azimuthStepDeg:180,obstructionElevationDeg:[5,15]};
    expect(obstructionAt(90,profile)).toBe(10); expect(terrainVisible(0,4,profile)).toBe(false); expect(terrainVisible(0,5,profile)).toBe(true); expect(terrainVisible(0,5,null)).toBeNull();
    expect(obstructionAt(0,{...profile,azimuthStepDeg:120})).toBeNull();
  });
});

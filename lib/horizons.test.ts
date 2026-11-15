import { describe, expect, it } from "vitest";
import { combineObserverSamples, parseHorizonsObserverCsv } from "./horizons";

describe("JPL Horizons observer CSV",()=>{
  it("maps live quantity 4, 13 and 20 fields after presence markers",()=>{
    // Captured from a live JPL Horizons observer query for 2026-Nov-15, Moon site.
    const csv="$$SOE\n 2026-Nov-15 00:00:00,*, , 251.908179, 1.389713, 1941.613, 1.4781418544E+08, 0.3961428,\n$$EOE";
    expect(parseHorizonsObserverCsv(csv)).toEqual([{time:"2026-11-15T00:00:00.000Z",azimuth:251.908179,elevation:1.389713,angularDiameterArcsec:1941.613,rangeKm:147814185.44}]);
  });
  it("rejects malformed rows and non-physical elevation values",()=>{
    expect(()=>parseHorizonsObserverCsv("no table")).toThrow("did not return an ephemeris table");
    expect(()=>parseHorizonsObserverCsv("$$SOE\n 2026-Nov-15 00:00:00,*, , 250, 100, 10, 1000, 0\n$$EOE")).toThrow("unexpected observer CSV row");
  });
  it("rejects duplicate or out-of-order Horizons epochs",()=>{
    const duplicate="$$SOE\n 2026-Nov-15 00:00:00,*, , 250, 10, 10, 1000, 0\n 2026-Nov-15 00:00:00,*, , 251, 11, 10, 1000, 0\n$$EOE";
    const reversed="$$SOE\n 2026-Nov-15 02:00:00,*, , 250, 10, 10, 1000, 0\n 2026-Nov-15 00:00:00,*, , 251, 11, 10, 1000, 0\n$$EOE";
    expect(()=>parseHorizonsObserverCsv(duplicate)).toThrow("duplicate or out-of-order");
    expect(()=>parseHorizonsObserverCsv(reversed)).toThrow("duplicate or out-of-order");
  });
  it("refuses to pair Sun and Earth data with different timestamps",()=>{
    const sun=parseHorizonsObserverCsv("$$SOE\n 2026-Nov-15 00:00:00,*, , 250, 10, 10, 1000, 0\n$$EOE");
    const earth=parseHorizonsObserverCsv("$$SOE\n 2026-Nov-15 01:00:00,*, , 250, 10, 10, 1000, 0\n$$EOE");
    expect(()=>combineObserverSamples(sun,earth)).toThrow("do not share matching timestamps");
  });
});

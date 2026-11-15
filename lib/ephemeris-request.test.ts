import { describe, expect, it } from "vitest";
import { parseEphemerisRequest } from "./ephemeris-request";

const valid = (overrides: Record<string, string> = {}) => new URLSearchParams({
  lat: "-89.5",
  lon: "0",
  start: "2026-11-15T00:00:00Z",
  hours: "48",
  step: "2",
  ...overrides,
});

describe("Horizons API request validation", () => {
  it("rejects omitted or blank lunar coordinates instead of coercing them to zero", () => {
    const missingLatitude = valid();
    missingLatitude.delete("lat");
    expect(parseEphemerisRequest(missingLatitude).ok).toBe(false);
    expect(parseEphemerisRequest(valid({ lon: " " })).ok).toBe(false);
  });

  it("accepts the zero meridian and converts offset times to UTC", () => {
    const result = parseEphemerisRequest(valid({ start: "2026-11-15T03:00:00+03:00", hours: "24", step: "6" }));
    expect(result).toEqual({
      ok: true,
      value: {
        latitude: -89.5,
        longitude: 0,
        startUtc: "2026-11-15T00:00:00Z",
        stopUtc: "2026-11-16T00:00:00Z",
        hours: 24,
        stepHours: 6,
      },
    });
  });

  it("rejects a window that the sample interval cannot cover through its requested end", () => {
    expect(parseEphemerisRequest(valid({ hours: "25", step: "24" }))).toMatchObject({ ok: false });
  });

  it("rejects invalid coordinate bounds, unsupported steps, and timestamps without a timezone", () => {
    expect(parseEphemerisRequest(valid({ lat: "-91" })).ok).toBe(false);
    expect(parseEphemerisRequest(valid({ step: "5" })).ok).toBe(false);
    expect(parseEphemerisRequest(valid({ start: "2026-11-15T00:00:00" })).ok).toBe(false);
  });
});

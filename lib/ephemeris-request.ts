const SAMPLE_INTERVALS = [1, 2, 3, 4, 6, 8, 12, 24] as const;

export type ValidEphemerisRequest = {
  latitude: number;
  longitude: number;
  startUtc: string;
  stopUtc: string;
  hours: number;
  stepHours: number;
};

export type EphemerisRequestResult =
  | { ok: true; value: ValidEphemerisRequest }
  | { ok: false; error: string };

/** Validate and normalize the public API's time/coordinate query parameters. */
export function parseEphemerisRequest(params: URLSearchParams): EphemerisRequestResult {
  const latitudeText = params.get("lat");
  const longitudeText = params.get("lon");
  const latitude = latitudeText === null || latitudeText.trim() === "" ? Number.NaN : Number(latitudeText);
  const longitude = longitudeText === null || longitudeText.trim() === "" ? Number.NaN : Number(longitudeText);
  const start = params.get("start") ?? "";
  const hours = Number(params.get("hours") ?? 48);
  const stepHours = Number(params.get("step") ?? 2);
  const isIsoInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(start);
  const isValid = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -360 && longitude <= 360 &&
    isIsoInstant && Number.isFinite(Date.parse(start)) && Number.isInteger(hours) &&
    SAMPLE_INTERVALS.includes(stepHours as (typeof SAMPLE_INTERVALS)[number]) &&
    hours >= 1 && hours <= 336 && hours % stepHours === 0;

  if (!isValid) {
    return { ok: false, error: "Use valid lunar coordinates, an ISO date/time with a timezone, and a 1–336 hour window divisible by a supported sample interval." };
  }

  const startUtc = new Date(Date.parse(start)).toISOString().replace(".000Z", "Z");
  const stopUtc = new Date(Date.parse(startUtc) + hours * 3_600_000).toISOString().replace(".000Z", "Z");
  return { ok: true, value: { latitude, longitude, startUtc, stopUtc, hours, stepHours } };
}

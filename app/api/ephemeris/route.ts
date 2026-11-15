import { NextRequest, NextResponse } from "next/server";
import type { EphemerisPoint } from "@/lib/science";
import { combineObserverSamples, parseHorizonsObserverCsv } from "@/lib/horizons";
import { parseEphemerisRequest } from "@/lib/ephemeris-request";

export const runtime = "nodejs";
const cache = new Map<string, { expires: number; points: EphemerisPoint[] }>();
const inFlight = new Map<string, Promise<EphemerisPoint[]>>();
let activeHorizonsQueries = 0;
const horizonsQueue: Array<() => void> = [];
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_LIMIT = 256;

function pruneCache(now: number) {
  for (const [key, entry] of cache) if (entry.expires <= now) cache.delete(key);
  while (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

async function withHorizonsSlot<T>(operation: () => Promise<T>): Promise<T> {
  if (activeHorizonsQueries < 2) activeHorizonsQueries += 1;
  else await new Promise<void>((resolve) => horizonsQueue.push(resolve));
  try {
    return await operation();
  } finally {
    const next = horizonsQueue.shift();
    if (next) next();
    else activeHorizonsQueries -= 1;
  }
}

async function query(command: string, lon: number, lat: number, start: string, stop: string, step: number) {
  const p = new URLSearchParams({ format:"text", COMMAND:`'${command}'`, OBJ_DATA:"'NO'", MAKE_EPHEM:"'YES'", EPHEM_TYPE:"'OBSERVER'", CENTER:"'coord@301'", COORD_TYPE:"'GEODETIC'", SITE_COORD:`'${lon},${lat},0'`, START_TIME:`'${start}'`, STOP_TIME:`'${stop}'`, STEP_SIZE:`'${step} h'`, TIME_TYPE:"'UT'", TIME_DIGITS:"'SECONDS'", REF_SYSTEM:"'ICRF'", APPARENT:"'AIRLESS'", RANGE_UNITS:"'KM'", QUANTITIES:"'4,13,20'", CSV_FORMAT:"'YES'", CAL_TYPE:"'GREGORIAN'" });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await withHorizonsSlot(() => fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${p}`, { signal: AbortSignal.timeout(30_000), next: { revalidate: 300 } }));
    if (response.ok) return parseHorizonsObserverCsv(await response.text());
    if (![429, 502, 503, 504].includes(response.status) || attempt === 2) {
      await response.body?.cancel();
      throw new Error(`JPL Horizons returned HTTP ${response.status}.`);
    }
    await response.body?.cancel();
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1_000, 5_000) : 400 * 2 ** attempt));
  }
  throw new Error("JPL Horizons did not return a response.");
}
export async function GET(req: NextRequest) {
  const parsed = parseEphemerisRequest(req.nextUrl.searchParams);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status:400 });
  const { latitude:lat, longitude:lon, startUtc, stopUtc:stop, hours, stepHours:step } = parsed.value;
  const key = [lat,lon,startUtc,hours,step].join("|"); const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return NextResponse.json({ source:"JPL Horizons", points:hit.points, cached:true });
  const sharedRequest = inFlight.has(key);
  let request = inFlight.get(key);
  if (!request) {
    request = (async () => {
      const eastLon = ((lon % 360) + 360) % 360;
      const [sun, earth] = await Promise.all([query("10",eastLon,lat,startUtc,stop,step),query("399",eastLon,lat,startUtc,stop,step)]);
      const points = combineObserverSamples(sun, earth);
      pruneCache(Date.now());
      cache.set(key,{expires:Date.now()+CACHE_TTL_MS,points});
      return points;
    })();
    inFlight.set(key, request);
  }
  try {
    return NextResponse.json({source:"JPL Horizons", points:await request, cached:sharedRequest});
  } catch (e) {
    return NextResponse.json({ error:`Could not load lunar ephemeris from JPL Horizons. ${e instanceof Error ? e.message : "Try again later."}` },{status:502});
  } finally {
    if (inFlight.get(key) === request) inFlight.delete(key);
  }
}

export type HorizonsObserverSample = { time: string; azimuth: number; elevation: number; angularDiameterArcsec: number | null; rangeKm: number };

/** Pair Sun and Earth rows only when Horizons returned the same observation epochs. */
export function combineObserverSamples(sun: HorizonsObserverSample[], earth: HorizonsObserverSample[]) {
  if (!sun.length || sun.length !== earth.length) throw new Error("JPL Horizons returned incomplete Sun/Earth samples.");
  return sun.map((s, i) => {
    const e = earth[i];
    if (!e || s.time !== e.time) throw new Error("JPL Horizons Sun and Earth samples do not share matching timestamps.");
    return {
      time: s.time,
      sunAz: s.azimuth,
      sunEl: s.elevation,
      sunRangeKm: s.rangeKm,
      sunAngularDiameterArcsec: s.angularDiameterArcsec ?? undefined,
      earthAz: e.azimuth,
      earthEl: e.elevation,
      earthRangeKm: e.rangeKm,
      earthAngularDiameterArcsec: e.angularDiameterArcsec ?? undefined,
      source: "JPL Horizons" as const,
    };
  });
}

/** Parse the standard Horizons CSV observer layout for quantities 4,13,20. */
export function parseHorizonsObserverCsv(text: string): HorizonsObserverSample[] {
  const section = text.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
  if (!section) throw new Error(text.match(/\*\*\s*Error[\s\S]{0,300}/)?.[0] ?? "Horizons did not return an ephemeris table.");
  const months:Record<string,string>={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
  const rows = section[1].trim().split(/\r?\n/).map(line=>{
    const columns=line.split(",").map(value=>value.trim().replace(/^"|"$/g,""));
    const date=columns[0]; const month=date.match(/-([A-Za-z]{3})-/)?.[1];
    const normalized=month && months[month]?date.replace(`-${month}-`,`-${months[month]}-`):date;
    const parsedTime=Date.parse(`${normalized.replace(" ","T")}Z`);
    const time=Number.isFinite(parsedTime)?new Date(parsedTime).toISOString():"";
    const azimuth=Number(columns[3]), elevation=Number(columns[4]);
    const diameter=columns[5]===""||columns[5]==="n.a."?null:Number(columns[5]);
    const rangeKm=Number(columns[6]);
    if(!date||!time||!Number.isFinite(azimuth)||azimuth<0||azimuth>=360||!Number.isFinite(elevation)||!Number.isFinite(rangeKm)||rangeKm<0||(diameter!==null&&(!Number.isFinite(diameter)||diameter<=0))||Math.abs(elevation)>90) throw new Error("Horizons returned an unexpected observer CSV row format.");
    return {time,azimuth,elevation,angularDiameterArcsec:diameter,rangeKm};
  });
  if (rows.some((row, index) => index > 0 && Date.parse(row.time) <= Date.parse(rows[index - 1].time))) throw new Error("Horizons returned duplicate or out-of-order observation timestamps.");
  return rows;
}

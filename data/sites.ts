export type LandingSite = { id: string; name: string; latitude: number; longitude: number; code: string; description: string };
// Feature center coordinates transcribed from NASA Lunar Surface Data Book Rev A, Table A2-2.
export const SITES: LandingSite[] = [
  { id: "connecting-ridge", name: "Connecting Ridge", latitude: -89.4632, longitude: -137.49, code: "Site 01", description: "Ridge between the Shackleton and de Gerlache regions." },
  { id: "shackleton-rim", name: "Shackleton Rim", latitude: -89.7668, longitude: -171.87, code: "Site 04", description: "Near the rim of Shackleton crater." },
  { id: "peak-near-shackleton", name: "Peak near Shackleton", latitude: -88.811, longitude: 123.6901, code: "Site 07", description: "High terrain near the Shackleton rim." },
  { id: "de-gerlache-rim", name: "de Gerlache Rim 1", latitude: -88.6834, longitude: -67.9321, code: "Site 11", description: "Candidate point on de Gerlache crater rim." },
  { id: "leibnitz-beta", name: "Leibnitz Beta Plateau", latitude: -85.4266, longitude: 31.74276, code: "Site 20", description: "Elevated plateau in the southern highlands." },
  { id: "malapert-massif", name: "Malapert Massif", latitude: -85.9948, longitude: -0.23578, code: "Site 23", description: "Massif west of the lunar south pole." }
];

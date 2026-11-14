// Bakes public/geo/world-borders.json — the coastlines and country borders
// drawn on the Fan Zone globe (components/fans-zone/CampaignGlobe.tsx).
//
// Not part of the build: run it by hand when the amount of detail needs to
// change. Its dependencies are deliberately kept out of package.json — install
// them in any folder outside the project and point the script at that folder:
//
//   mkdir ../geo-deps && cd ../geo-deps
//   npm install topojson-client@3 topojson-server@3 topojson-simplify@3 world-atlas@2
//   cd - && node scripts/bake-world-borders.mjs ../geo-deps
//
// usage: node scripts/bake-world-borders.mjs <depsDir> [outFile] [fine] [coarse] [q]
//
// Source: world-atlas countries-50m (Natural Earth 1:50m, public domain), read
// as data only. The output is not TopoJSON. It is two lists of polylines with
// integer, delta-encoded coordinates, so the browser needs no decoding library:
//
//   { "q": 100, "coast": [[lng0, lat0, Δlng, Δlat, Δlng, Δlat, …], …], "borders": […] }
//
// Every value is degrees × q. A line is continuous: where it crosses the
// antimeridian its longitude simply runs on past ±180. Detail is kept where the
// finals were played (western and central Europe) and thinned everywhere else.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const [depsArg, outArg, fineArg, coarseArg, qArg] = process.argv.slice(2);
if (!depsArg) {
  console.error(
    "usage: node scripts/bake-world-borders.mjs <depsDir> [outFile] [fine] [coarse] [q]"
  );
  process.exit(1);
}

const depsDir = path.resolve(depsArg);
const outFile = outArg
  ? path.resolve(outArg)
  : path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../public/geo/world-borders.json"
    );

const load = createRequire(path.join(depsDir, "noop.js"));
const topoClient = load("topojson-client");
const topoServer = load("topojson-server");
const topoSimplify = load("topojson-simplify");

// Visvalingam triangle-area thresholds, in square degrees.
const FINE = Number(fineArg ?? 1e-4);
const COARSE = Number(coarseArg ?? 6e-2);
const Q = Number(qArg ?? 100);

// Full detail inside this lon/lat box; it blends out over BLEND degrees.
const DETAIL = { w: -13, s: 34.5, e: 34, n: 60.5 };
const BLEND = 9;

// 0 inside the detail box, rising to 1 at BLEND degrees outside it.
function remoteness(lon, lat) {
  const dx = Math.max(DETAIL.w - lon, 0, lon - DETAIL.e);
  const dy = Math.max(DETAIL.s - lat, 0, lat - DETAIL.n);
  return Math.min(1, Math.hypot(dx, dy) / BLEND);
}
// Log-interpolated between FINE and COARSE.
const pointThreshold = (lon, lat) =>
  FINE * Math.pow(COARSE / FINE, remoteness(lon, lat));
// Smallest island worth drawing: tiny near the detail box, large far away.
const ringThreshold = (lon, lat) =>
  0.004 * Math.pow(0.35 / 0.004, remoteness(lon, lat));

const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, n = ring.length - 1; i < n; i += 1) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum) / 2;
};
const ringCentre = (ring) => {
  let x = 0;
  let y = 0;
  for (const point of ring) {
    x += point[0];
    y += point[1];
  }
  return [x / ring.length, y / ring.length];
};

const world = JSON.parse(
  fs.readFileSync(
    path.join(depsDir, "node_modules/world-atlas/countries-50m.json"),
    "utf8"
  )
);

// 1) Drop islands too small to matter at the zoom they will be seen at.
const features = [];
let droppedRings = 0;
for (const feature of topoClient.feature(world, world.objects.countries).features) {
  const geometry = feature.geometry;
  if (!geometry) continue;
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  const kept = polygons.filter((rings) => {
    const [lon, lat] = ringCentre(rings[0]);
    const keep = ringArea(rings[0]) >= ringThreshold(lon, lat);
    if (!keep) droppedRings += 1;
    return keep;
  });
  if (kept.length === 0) continue;
  features.push({
    type: "Feature",
    id: feature.id,
    properties: {},
    // Holes (lakes inside a country) aren't coastline at this scale.
    geometry: { type: "MultiPolygon", coordinates: kept.map((rings) => [rings[0]]) },
  });
}

// 2) Shared-arc topology, then thin each arc by a location-dependent threshold.
const topology = topoSimplify.presimplify(
  topoServer.topology({ countries: { type: "FeatureCollection", features } })
);
let before = 0;
let after = 0;
topology.arcs = topology.arcs.map((arc) => {
  before += arc.length;
  const last = arc.length - 1;
  const thinned = arc.filter(
    (point, i) =>
      i === 0 || i === last || point[2] >= pointThreshold(point[0], point[1])
  );
  after += thinned.length;
  return thinned.map((point) => [point[0], point[1]]);
});

// 3) Coast = arcs with land on one side only; borders = arcs between countries.
const object = topology.objects.countries;
const coast = topoClient.mesh(topology, object, (a, b) => a === b).coordinates;
const borders = topoClient.mesh(topology, object, (a, b) => a !== b).coordinates;

// 4) Mend the antimeridian. The source cuts every polygon that crosses it in
// two, so longitudes jump from +180 to −180 there and the cut itself shows up
// as "coast". Make each line continuous (which is why a longitude may run past
// ±180) and drop the edges that run along the cut or sit on a pole: neither is
// a coastline. Left alone, a jump is drawn the long way round the planet — a
// ring around the Arctic at Wrangel Island's latitude.
const onSeam = (lon) => Math.abs((((lon % 360) + 360) % 360) - 180) < 0.02;
const atPole = (lat) => Math.abs(lat) > 89.9;
let seamEdges = 0;
function mendSeam(lines) {
  const mended = [];
  for (const line of lines) {
    let piece = [];
    let previous = null;
    let shift = 0;
    for (const [rawLon, lat] of line) {
      let lon = rawLon + shift;
      if (previous) {
        while (lon - previous[0] > 180) {
          lon -= 360;
          shift -= 360;
        }
        while (lon - previous[0] < -180) {
          lon += 360;
          shift += 360;
        }
        if (
          (onSeam(previous[0]) && onSeam(lon)) ||
          (atPole(previous[1]) && atPole(lat))
        ) {
          seamEdges += 1;
          if (piece.length >= 2) mended.push(piece);
          piece = [];
        }
      }
      piece.push([lon, lat]);
      previous = [lon, lat];
    }
    if (piece.length >= 2) mended.push(piece);
  }
  return mended;
}

// 5) Integer delta encoding.
const encode = (lines) =>
  lines
    .map((line) => {
      const out = [];
      let px = 0;
      let py = 0;
      line.forEach(([lon, lat], i) => {
        const x = Math.round(lon * Q);
        const y = Math.round(lat * Q);
        if (i > 0 && x === px && y === py) return; // collapsed by rounding
        out.push(i === 0 ? x : x - px, i === 0 ? y : y - py);
        px = x;
        py = y;
      });
      return out;
    })
    .filter((line) => line.length >= 4);

const result = {
  q: Q,
  coast: encode(mendSeam(coast)),
  borders: encode(mendSeam(borders)),
};
const json = JSON.stringify(result);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, json);

const count = (lines) => lines.reduce((n, line) => n + line.length / 2, 0);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)}KB`;
console.log(
  [
    `fine=${FINE} coarse=${COARSE} q=${Q}`,
    `islands dropped: ${droppedRings}`,
    `arc points: ${before} -> ${after}`,
    `antimeridian/pole edges dropped: ${seamEdges}`,
    `coast: ${result.coast.length} lines, ${count(result.coast)} points`,
    `borders: ${result.borders.length} lines, ${count(result.borders)} points`,
    `size: ${kb(json.length)} raw, ${kb(zlib.gzipSync(json, { level: 9 }).length)} gzip, ${kb(zlib.brotliCompressSync(json).length)} brotli`,
    `wrote ${outFile}`,
  ].join("\n")
);

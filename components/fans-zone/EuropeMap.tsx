"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  useMapContext,
} from "react-simple-maps/core";
import type { TitleSite, UclTitle } from "@/lib/ucl-history";
import { MQ_LG, MQ_SM, useMediaQuery } from "./hooks";

// The map canvas for "Reyes de Europa". Loaded client-only (next/dynamic,
// ssr: false) by ReyesDeEuropa.tsx, for two reasons:
//
//   1. Hydration. Marker positions come out of trig-heavy projection maths
//      whose last decimal differs between JS engines, so a server-rendered
//      `translate(x, y)` can disagree with the browser's. Rendering the canvas
//      only in the browser removes that whole class of mismatch.
//   2. Weight. d3-geo, topojson-client and react-simple-maps stay out of the
//      route's server-rendered critical path.
//
// It is also deliberately not the accessible control: the timeline rail offers
// every title as a real button, so this layer is aria-hidden and pointer-only.

// TopoJSON basemap. Self-hosted rather than fetched from a public CDN: the
// site's CSP (next.config.ts → connect-src) only allows same-origin requests,
// and a Europe-only cut is ~5× smaller than the world file it comes from.
//
// Provenance: world-atlas@2.0.2 `countries-50m.json` (Natural Earth 1:50m,
// public domain), clipped to the frames below, simplified (Visvalingam,
// 6e-4 deg²) and re-quantized to 1e4. Same schema as the original — a
// Topology whose first object is `countries`.
const GEO_URL = "/geo/europe-50m.json";

const GOLD = "#D4AF37";
const GOLD_HOT = "#FFF4CC";
const LAND_FILL = "#111111";
const LAND_STROKE = "#222222";
const INK = "#06080d"; // the stage colour — text halos are cut out of it

// Azimuthal equal-area, tangent at 15°E 50°N — the same projection family the
// EU uses for its own maps, so the continent keeps its familiar proportions
// instead of Mercator's swollen north. An azimuthal projection is centred by
// rotating the globe, hence `rotate: [-15, -50]` rather than `center: [15, 50]`;
// each preset's `center` is then only a small offset (in rotated degrees) that
// slides the continent around inside the frame.
const ROTATE: [number, number, number] = [-15, -50, 0];

interface MapPreset {
  /** viewBox size. Must match the aspect ratio the stage reserves in CSS. */
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly center: [number, number];
  /** Marker radius in viewBox units. */
  readonly dot: number;
  readonly fit: "xMidYMid meet" | "xMinYMid slice";
  /** Show the city label beside the hovered / active marker. */
  readonly labels: boolean;
}

const PRESETS: Record<"compact" | "medium" | "wide", MapPreset> = {
  // Phones: portrait frame, the fifteen finals spread edge to edge.
  compact: {
    width: 400,
    height: 430,
    scale: 650,
    center: [-4.6, 2.6],
    dot: 4.4,
    fit: "xMidYMid meet",
    labels: false,
  },
  // Large phones / tablets: landscape frame, finals centred.
  medium: {
    width: 800,
    height: 520,
    scale: 940,
    center: [-4.6, 3],
    dot: 4.2,
    fit: "xMidYMid meet",
    labels: false,
  },
  // Desktop: every final sits in the left half, leaving the east free for the
  // floating card. `slice` anchored left means a narrower stage only ever
  // crops that empty eastern edge, never a marker.
  wide: {
    width: 1200,
    height: 640,
    scale: 950,
    center: [14, 2.5],
    dot: 3.6,
    fit: "xMinYMid slice",
    labels: true,
  },
};

// How close (in CSS px) a click has to land to a marker to count. Hit-testing
// picks the *nearest* marker inside this radius, so the crowded north-west
// (London, Cardiff, Brussels, Amsterdam, Paris) never has overlapping targets.
const PICK_RADIUS_PX = 28;

const PULSE_SECONDS = 2.8;
const PULSE_REACH = 4.4; // ripple grows to this multiple of the dot radius
const IGNITE_STAGGER = 0.07; // seconds between markers lighting up, oldest first
// If the basemap hasn't arrived by now, light the markers anyway.
const LAND_TIMEOUT_MS = 3500;

type DotState = "idle" | "hot" | "active" | "dimmed";

export interface EuropeMapProps {
  titles: readonly UclTitle[];
  sites: readonly TitleSite[];
  activeLocation: UclTitle | null;
  /** City being pointed at — on the map or on the timeline. */
  highlightedCity: string | null;
  /** Stops the ambient pulses, e.g. while a sheet covers the map. */
  paused: boolean;
  onSelectSite: (site: TitleSite) => void;
  onHighlightCity: (city: string | null) => void;
  /** A click on open water / empty land. */
  onDismiss: () => void;
}

export default function EuropeMap({
  titles,
  sites,
  activeLocation,
  highlightedCity,
  paused,
  onSelectSite,
  onHighlightCity,
  onDismiss,
}: EuropeMapProps) {
  const isLg = useMediaQuery(MQ_LG);
  const isSm = useMediaQuery(MQ_SM);
  const preset = isLg ? PRESETS.wide : isSm ? PRESETS.medium : PRESETS.compact;

  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "160px 0px" });
  const reduceMotion = useReducedMotion() ?? false;

  const [landReady, setLandReady] = useState(false);
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);
  const handleLandReady = useCallback(() => setLandReady(true), []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setWaitedLongEnough(true),
      LAND_TIMEOUT_MS
    );
    return () => window.clearTimeout(timer);
  }, []);

  // The markers ignite once — the first time the map is on screen with its
  // coastlines drawn — and stay lit. A one-way latch, set during render (the
  // documented alternative to mirroring props into state from an effect).
  const [lit, setLit] = useState(false);
  if (!lit && inView && (landReady || waitedLongEnough)) setLit(true);

  // Ambient motion only runs while it can be seen.
  const pulsing = lit && inView && !paused && !reduceMotion;

  return (
    <div ref={rootRef} className="absolute inset-0">
      {/* Layer 1 — the basemap. It never changes after load, so it lives on
          its own compositor layer: the pulsing markers above repaint a nearly
          empty SVG instead of re-rasterising every coastline each frame. */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: landReady ? 1 : 0 }}
        transition={{ duration: reduceMotion ? 0 : 1.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 will-change-transform"
      >
        <BaseMap preset={preset} onReady={handleLandReady} />
      </motion.div>

      {/* Layer 2 — scrims. They sit *under* the markers so they only ever
          quieten the land, never a gold dot. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Phones: the map rises out of the intro copy above it. */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#06080d] to-transparent lg:hidden" />
        {/* Desktop: the east fades out beneath the story column. */}
        <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-[linear-gradient(to_left,#06080d_0%,rgba(6,8,13,0.9)_26%,rgba(6,8,13,0.45)_60%,transparent_100%)] lg:block" />
        {/* The timeline rail reads against a clean floor. */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#06080d] to-transparent lg:h-48 lg:via-[#06080d]/80" />
      </div>

      {/* Layer 3 — markers and the pointer surface. */}
      <ComposableMap
        aria-hidden
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: ROTATE,
          center: preset.center,
          scale: preset.scale,
        }}
        width={preset.width}
        height={preset.height}
        preserveAspectRatio={preset.fit}
        className="absolute inset-0 h-full w-full select-none"
      >
        <MarkerLayer
          preset={preset}
          titles={titles}
          sites={sites}
          activeLocation={activeLocation}
          highlightedCity={highlightedCity}
          lit={lit}
          pulsing={pulsing}
          reduceMotion={reduceMotion}
          onSelectSite={onSelectSite}
          onHighlightCity={onHighlightCity}
          onDismiss={onDismiss}
        />
      </ComposableMap>
    </div>
  );
}

// --- Basemap ----------------------------------------------------------------

// Fires once, from inside <Geographies>' render prop — which react-simple-maps
// only calls after the TopoJSON has been fetched and parsed.
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

// Memoised on the preset alone: hovering and selecting re-render the marker
// layer many times a second, and none of that should touch ~90 country paths.
const BaseMap = memo(function BaseMap({
  preset,
  onReady,
}: {
  preset: MapPreset;
  onReady: () => void;
}) {
  return (
    <ComposableMap
      projection="geoAzimuthalEqualArea"
      projectionConfig={{
        rotate: ROTATE,
        center: preset.center,
        scale: preset.scale,
      }}
      width={preset.width}
      height={preset.height}
      preserveAspectRatio={preset.fit}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) => (
          <>
            {geographies.map((geography) => (
              <Geography
                key={geography.rsmKey}
                geography={geography}
                // The library makes every country a tab stop by default.
                tabIndex={-1}
                fill={LAND_FILL}
                stroke={LAND_STROKE}
                strokeWidth={0.7}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <Ready onReady={onReady} />
          </>
        )}
      </Geographies>
    </ComposableMap>
  );
});

// --- Markers ----------------------------------------------------------------

interface MarkerLayerProps {
  preset: MapPreset;
  titles: readonly UclTitle[];
  sites: readonly TitleSite[];
  activeLocation: UclTitle | null;
  highlightedCity: string | null;
  lit: boolean;
  pulsing: boolean;
  reduceMotion: boolean;
  onSelectSite: (site: TitleSite) => void;
  onHighlightCity: (city: string | null) => void;
  onDismiss: () => void;
}

function MarkerLayer({
  preset,
  titles,
  sites,
  activeLocation,
  highlightedCity,
  lit,
  pulsing,
  reduceMotion,
  onSelectSite,
  onHighlightCity,
  onDismiss,
}: MarkerLayerProps) {
  const { projection, width, height } = useMapContext();
  const haloId = `rde-halo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Site positions in viewBox units, for hit-testing and labels.
  const points = useMemo(
    () =>
      sites.flatMap((site) => {
        const xy = projection(site.coords);
        return xy ? [{ site, x: xy[0], y: xy[1] }] : [];
      }),
    [sites, projection]
  );

  // Per-title timing. `order` staggers the ignition chronologically; `phase`
  // offsets the pulse so that a city with several titles sends out that many
  // evenly spaced ripples per cycle — Paris beats three times, Glasgow twice.
  const choreography = useMemo(() => {
    const byYear = new Map<number, { order: number; phase: number }>();
    sites.forEach((site, siteIndex) => {
      const siteOffset = (siteIndex * 0.47) % 1;
      site.titles.forEach((title, k) => {
        byYear.set(title.year, {
          order: titles.indexOf(title),
          phase: ((siteOffset + k / site.titles.length) % 1) * PULSE_SECONDS,
        });
      });
    });
    return byYear;
  }, [sites, titles]);

  // Nearest site to a pointer position, or null if none is within reach.
  const pickSite = (
    clientX: number,
    clientY: number,
    svg: SVGSVGElement | null
  ): TitleSite | null => {
    const matrix = svg?.getScreenCTM();
    if (!matrix) return null;
    const local = new DOMPoint(clientX, clientY).matrixTransform(
      matrix.inverse()
    );
    // CSS px → viewBox units (the viewBox is scaled uniformly).
    let reach = PICK_RADIUS_PX / Math.hypot(matrix.a, matrix.b);
    let nearest: TitleSite | null = null;
    for (const point of points) {
      const distance = Math.hypot(point.x - local.x, point.y - local.y);
      if (distance <= reach) {
        reach = distance;
        nearest = point.site;
      }
    }
    return nearest;
  };

  // Draw the active title last so its ring sits on top of its neighbours.
  const drawOrder = useMemo(() => {
    if (!activeLocation) return titles;
    return [
      ...titles.filter((title) => title.year !== activeLocation.year),
      activeLocation,
    ];
  }, [titles, activeLocation]);

  const labelCity = highlightedCity ?? activeLocation?.city ?? null;
  const labelPoint =
    preset.labels && labelCity
      ? points.find((point) => point.site.city === labelCity)
      : undefined;

  return (
    <>
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
          <stop offset="42%" stopColor={GOLD} stopOpacity={0.14} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* The one pointer surface. Markers themselves ignore the pointer. */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        pointerEvents="all"
        style={{ cursor: highlightedCity ? "pointer" : "default" }}
        onClick={(event) => {
          const site = pickSite(
            event.clientX,
            event.clientY,
            event.currentTarget.ownerSVGElement
          );
          if (site) onSelectSite(site);
          else onDismiss();
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;
          const site = pickSite(
            event.clientX,
            event.clientY,
            event.currentTarget.ownerSVGElement
          );
          onHighlightCity(site ? site.city : null);
        }}
        onPointerLeave={() => onHighlightCity(null)}
      />

      {drawOrder.map((title) => {
        const timing = choreography.get(title.year);
        const isActive = activeLocation?.year === title.year;
        const state: DotState = isActive
          ? "active"
          : activeLocation
            ? "dimmed"
            : highlightedCity === title.city
              ? "hot"
              : "idle";

        return (
          <Marker
            key={title.year}
            coordinates={title.coords}
            style={{ pointerEvents: "none" }}
          >
            <TitleDot
              radius={preset.dot}
              order={timing?.order ?? 0}
              phase={timing?.phase ?? 0}
              state={state}
              // A dimmed marker that is being pointed at still answers.
              lifted={!isActive && highlightedCity === title.city}
              lit={lit}
              pulsing={pulsing}
              reduceMotion={reduceMotion}
              haloId={haloId}
            />
          </Marker>
        );
      })}

      {labelPoint ? (
        <motion.text
          key={labelPoint.site.city}
          x={labelPoint.x}
          y={labelPoint.y - preset.dot * 4.6}
          textAnchor="middle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="font-mono"
          fontSize={10}
          letterSpacing="0.2em"
          fill="#F6ECC4"
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ pointerEvents: "none" }}
        >
          {[
            labelPoint.site.city,
            ...labelPoint.site.titles.map((title) => title.year),
          ]
            .join(" · ")
            .toUpperCase()}
        </motion.text>
      ) : null}
    </>
  );
}

interface TitleDotProps {
  radius: number;
  order: number;
  phase: number;
  state: DotState;
  lifted: boolean;
  lit: boolean;
  pulsing: boolean;
  reduceMotion: boolean;
  haloId: string;
}

function TitleDot({
  radius,
  order,
  phase,
  state,
  lifted,
  lit,
  pulsing,
  reduceMotion,
  haloId,
}: TitleDotProps) {
  const isActive = state === "active";
  const settle = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 300, damping: 24 } as const);

  return (
    // Outer group: the one-off ignition, staggered oldest title first.
    <motion.g
      initial={false}
      animate={{ opacity: lit ? 1 : 0, scale: lit ? 1 : 0.2 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 380,
              damping: 19,
              delay: lit ? 0.2 + order * IGNITE_STAGGER : 0,
            }
      }
    >
      {/* Inner group: selection state — the hierarchy between markers. */}
      <motion.g
        initial={false}
        animate={{
          opacity: state === "dimmed" && !lifted ? 0.4 : 1,
          scale: isActive ? 1.35 : lifted || state === "hot" ? 1.22 : 1,
        }}
        transition={settle}
      >
        {pulsing ? (
          <motion.circle
            r={radius}
            fill={GOLD}
            fillOpacity={0.1}
            stroke={GOLD}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, PULSE_REACH], opacity: [0.7, 0] }}
            transition={{
              duration: PULSE_SECONDS,
              ease: "easeOut",
              repeat: Infinity,
              delay: phase,
            }}
          />
        ) : null}

        <circle r={radius * 2.8} fill={`url(#${haloId})`} />
        <circle r={radius} fill={isActive ? GOLD_HOT : GOLD} />

        {isActive ? (
          <motion.circle
            r={radius * 2.3}
            fill="none"
            stroke={GOLD}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={settle}
          />
        ) : null}
      </motion.g>
    </motion.g>
  );
}

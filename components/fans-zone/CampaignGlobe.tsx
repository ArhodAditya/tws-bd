"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useInView, useReducedMotion } from "framer-motion";
import type { CampaignSite, UclCampaignSummary } from "@/lib/ucl-campaigns";
import { siteKey } from "@/lib/ucl-campaigns";

// The WebGL globe for "Reyes de Europa". Loaded client-only (next/dynamic,
// ssr: false) by ReyesDeEuropa.tsx — three.js needs a browser, and it is far
// too heavy to sit on the route's critical path.
//
// Like the map it replaces, this is the pointer surface, not the accessible
// control: the timeline rail offers every campaign as a real button, so the
// globe is aria-hidden.

// The dark earth texture three-globe ships as its example image. Served from
// our own origin rather than unpkg: no third-party request on every visit, and
// the globe can't turn into a black sphere because a CDN is slow or blocked.
const EARTH_TEXTURE = "/textures/earth-dark.jpg";

const GOLD = "#D4AF37";
const GOLD_HOT = "#FFF4CC";

// Camera altitudes, in globe radii above the surface.
const IDLE_ALTITUDE = 1.75;
const FOCUS_ALTITUDE = 0.8;
const FOCUS_MS = 1200;
const RETREAT_MS = 1000;
// Where the camera rests before anything is chosen: over western Europe, where
// all but one of the finals were played.
const HOME_VIEW = { lat: 46, lng: 6, altitude: IDLE_ALTITUDE };

// How close (CSS px) a click must land to a beacon to count. The nearest
// beacon inside this radius wins, so the crowded north-west of Europe — five
// cities a few pixels apart at this scale — never has overlapping targets.
const PICK_RADIUS_PX = 30;
// A press that travels further than this is a drag (rotating the globe).
const DRAG_TOLERANCE_PX = 6;

const PULSE_SECONDS = 2.8;
const IGNITE_STAGGER_SECONDS = 0.08;

interface FlightArc {
  kind: "trail" | "flight";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export interface CampaignGlobeProps {
  sites: readonly CampaignSite[];
  /** The campaign whose panel is open, if any — the camera flies to it. */
  activeCampaign: UclCampaignSummary | null;
  /** The last two campaigns visited: the flight path runs between them. */
  previousLocation: UclCampaignSummary | null;
  currentLocation: UclCampaignSummary | null;
  /** Site being pointed at — on the globe or on the timeline. */
  highlightedSite: string | null;
  /** Shift the globe left to leave the right-hand side for the story column. */
  offsetForPanel: boolean;
  /** Freeze rendering, e.g. while a sheet covers the globe. */
  paused: boolean;
  onSelectSite: (site: CampaignSite) => void;
  onHighlightSite: (key: string | null) => void;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function CampaignGlobe({
  sites,
  activeCampaign,
  previousLocation,
  currentLocation,
  highlightedSite,
  offsetForPanel,
  paused,
  onSelectSite,
  onHighlightSite,
}: CampaignGlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const beacons = useRef(new Map<string, HTMLElement>());
  const pressedAt = useRef<{ x: number; y: number } | null>(null);

  const inView = useInView(rootRef, { margin: "160px 0px" });
  const reduceMotion = useReducedMotion() ?? false;

  // Client-only component, so the capability can be read up front.
  const [hasWebGL] = useState(supportsWebGL);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);

  // react-globe.gl sizes its canvas in pixels, not CSS — follow the container.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const activeSite = activeCampaign ? siteKey(activeCampaign.city) : null;

  // --- Beacons --------------------------------------------------------------
  // One HTML beacon per city. The globe library owns these DOM nodes (it
  // creates them once per datum and repositions them every frame), so they are
  // built imperatively here and restyled through a data attribute — never
  // re-created — when the selection changes.

  const beaconState = useCallback(
    (key: string) =>
      key === activeSite
        ? "active"
        : key === highlightedSite
          ? "hot"
          : activeSite
            ? "dimmed"
            : "idle",
    [activeSite, highlightedSite]
  );

  // Read by createBeacon, which the library may call at any time.
  const beaconStateRef = useRef(beaconState);
  useEffect(() => {
    beaconStateRef.current = beaconState;
    for (const [key, element] of beacons.current) {
      element.dataset.state = beaconState(key);
    }
  }, [beaconState, ready]);

  const createBeacon = useCallback(
    (datum: object): HTMLElement => {
      const site = datum as CampaignSite;
      const index = sites.findIndex((entry) => entry.key === site.key);
      const titles = site.campaigns.length;

      const root = document.createElement("div");
      root.className = "ucl-beacon";
      root.dataset.state = beaconStateRef.current(site.key);
      // Cities light up one after another, oldest first title first.
      root.style.setProperty(
        "--ucl-in",
        `${(0.3 + Math.max(0, index) * IGNITE_STAGGER_SECONDS).toFixed(2)}s`
      );

      // One ripple per title won here, evenly spaced through the cycle: Paris
      // beats three times, Glasgow twice. The count is the only legend.
      const siteOffset = (Math.max(0, index) * 0.47) % 1;
      for (let i = 0; i < titles; i += 1) {
        const ring = document.createElement("span");
        ring.className = "ucl-beacon__ring";
        ring.style.setProperty(
          "--ucl-phase",
          `${(((siteOffset + i / titles) % 1) * PULSE_SECONDS).toFixed(2)}s`
        );
        root.append(ring);
      }

      const dot = document.createElement("span");
      dot.className = "ucl-beacon__dot";
      root.append(dot);

      const label = document.createElement("span");
      label.className = "ucl-beacon__label";
      label.textContent = [
        site.city,
        ...site.campaigns.map((campaign) => campaign.year),
      ].join(" · ");
      root.append(label);

      beacons.current.set(site.key, root);
      return root;
    },
    [sites]
  );

  // The library diffs this array by object identity; keep it stable.
  const beaconData = useMemo(() => [...sites], [sites]);

  // --- Flight path ----------------------------------------------------------
  // From the previous stop to the current one. Two arcs share the route: a
  // faint trail that stays put, and the bright dash that flies along it.
  const arcs = useMemo<FlightArc[]>(() => {
    if (!previousLocation || !currentLocation) return [];
    if (siteKey(previousLocation.city) === siteKey(currentLocation.city)) return [];
    const route = {
      startLat: previousLocation.lat,
      startLng: previousLocation.lng,
      endLat: currentLocation.lat,
      endLng: currentLocation.lng,
    };
    return reduceMotion
      ? [{ kind: "trail", ...route }]
      : [
          { kind: "trail", ...route },
          { kind: "flight", ...route },
        ];
  }, [previousLocation, currentLocation, reduceMotion]);

  const isFlight = (arc: object) => (arc as FlightArc).kind === "flight";

  // --- Camera ---------------------------------------------------------------

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    // No wheel / pinch zoom: the page must keep scrolling when the pointer is
    // over the globe. Zoom is driven by choosing a campaign instead.
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.55;

    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Horizontal drags spin the globe; vertical swipes still scroll the page.
    renderer.domElement.style.touchAction = "pan-y";

    globe.pointOfView(HOME_VIEW, 0);
    setReady(true);
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;

    if (activeCampaign) {
      globe.pointOfView(
        {
          lat: activeCampaign.lat,
          lng: activeCampaign.lng,
          altitude: FOCUS_ALTITUDE,
        },
        reduceMotion ? 0 : FOCUS_MS
      );
    } else {
      // Panel closed: pull back, but stay above the last stop.
      globe.pointOfView({ altitude: IDLE_ALTITUDE }, reduceMotion ? 0 : RETREAT_MS);
    }
  }, [activeCampaign, ready, reduceMotion]);

  // Render only while it can be seen. When something covers the globe, let an
  // in-flight camera move finish before freezing the frame.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;

    if (inView && !paused) {
      globe.resumeAnimation();
      return;
    }
    const timer = window.setTimeout(
      () => globe.pauseAnimation(),
      paused && inView ? FOCUS_MS + 200 : 0
    );
    return () => window.clearTimeout(timer);
  }, [inView, paused, ready]);

  // --- Pointer --------------------------------------------------------------

  const nearestSite = (clientX: number, clientY: number): CampaignSite | null => {
    let reach = PICK_RADIUS_PX;
    let nearestKey: string | null = null;
    for (const [key, element] of beacons.current) {
      // The renderer hides beacons on the far side of the globe.
      if (!element.isConnected || element.style.display === "none") continue;
      const box = element.getBoundingClientRect();
      const distance = Math.hypot(box.left - clientX, box.top - clientY);
      if (distance <= reach) {
        reach = distance;
        nearestKey = key;
      }
    }
    return sites.find((site) => site.key === nearestKey) ?? null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.buttons !== 0) return;
    const site = nearestSite(event.clientX, event.clientY);
    onHighlightSite(site ? site.key : null);
  };

  const pointing = highlightedSite !== null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`absolute inset-0 select-none ${paused ? "ucl-globe--paused" : ""}`}
      style={{ cursor: pointing ? "pointer" : "grab" }}
      onPointerDown={(event) => {
        pressedAt.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => onHighlightSite(null)}
      onClick={(event) => {
        const press = pressedAt.current;
        pressedAt.current = null;
        // Releasing after a drag still fires a click — ignore it.
        if (
          press &&
          Math.hypot(event.clientX - press.x, event.clientY - press.y) >
            DRAG_TOLERANCE_PX
        ) {
          return;
        }
        const site = nearestSite(event.clientX, event.clientY);
        if (site) onSelectSite(site);
      }}
    >
      {hasWebGL && size ? (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          globeOffset={offsetForPanel ? [-Math.round(size.width * 0.17), 0] : [0, 0]}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={EARTH_TEXTURE}
          showAtmosphere
          atmosphereColor="#c9a548"
          atmosphereAltitude={0.16}
          animateIn={!reduceMotion}
          // Hit-testing is done against the beacons above; skipping the
          // library's per-frame raycasting is a real saving on phones.
          enablePointerInteraction={false}
          onGlobeReady={handleGlobeReady}
          htmlElementsData={beaconData}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude={0.012}
          htmlElement={createBeacon}
          htmlTransitionDuration={0}
          arcsData={arcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcAltitudeAutoScale={0.42}
          arcColor={(arc: object) =>
            isFlight(arc)
              ? [GOLD, GOLD_HOT]
              : ["rgba(212,175,55,0.12)", "rgba(212,175,55,0.5)"]
          }
          arcStroke={(arc: object) => (isFlight(arc) ? 0.5 : 0.14)}
          arcDashLength={(arc: object) => (isFlight(arc) ? 0.4 : 1)}
          arcDashGap={(arc: object) => (isFlight(arc) ? 4 : 0)}
          arcDashAnimateTime={(arc: object) => (isFlight(arc) ? 1500 : 0)}
          arcsTransitionDuration={reduceMotion ? 0 : 600}
        />
      ) : null}
    </div>
  );
}

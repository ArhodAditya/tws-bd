"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useInView, useReducedMotion } from "framer-motion";
import { Earth, Minus, Pause, Play, Plus } from "lucide-react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshPhongMaterial,
  TextureLoader,
} from "three";
import type { CampaignSite, UclCampaignSummary } from "@/lib/ucl-campaigns";
import { siteKey } from "@/lib/ucl-campaigns";

// The WebGL globe for "Reyes de Europa". Loaded client-only (next/dynamic,
// ssr: false) by ReyesDeEuropa.tsx — three.js needs a browser, and it is far
// too heavy to sit on the route's critical path.
//
// The globe itself is the pointer surface, not the accessible control: the
// timeline rail offers every campaign as a real button, so the canvas is
// aria-hidden. The small control bar beside it is ordinary, focusable buttons.

// Both textures are the ones three-globe ships as examples, served from our
// own origin rather than unpkg: no third-party request on every visit, and the
// globe can't turn into a black sphere because a CDN is slow or blocked.
const EARTH_TEXTURE = "/textures/earth-dark.jpg";
// A height map: black at sea level, white at the roof of the world. The earth
// image paints all land flat black, so bump shading alone has nothing to
// shade. The height map therefore does two jobs — it is the bump map, and it
// is an emissive map: land glows faintly in proportion to its height, so the
// lowlands stay dark while the Alps and the Pyrenees rise out of them in gold.
const EARTH_RELIEF = "/textures/earth-topology.png";
const RELIEF_TINT = "#8a7440";
const RELIEF_BUMP_SCALE = 8;
// Coastlines and country borders as vectors. The earth image is 2048px wide —
// fine from orbit, a blur up close — so the sharpness of a close-up comes from
// these lines, which stay one crisp pixel wide at any zoom.
// Baked by scripts/bake-world-borders.mjs from world-atlas 50m (Natural Earth,
// public domain): full detail over western and central Europe, thinned
// everywhere else. Format: see buildLines.
const BORDERS_URL = "/geo/world-borders.json";

const GOLD = "#D4AF37";
const GOLD_HOT = "#FFF4CC";

// three-globe's sphere has a fixed radius of 100 units; orbit distances are
// measured from its centre, altitudes in radii above its surface.
const GLOBE_RADIUS = 100;
const MIN_DISTANCE = 115;
const MAX_DISTANCE = 450;
const MIN_ALTITUDE = MIN_DISTANCE / GLOBE_RADIUS - 1;
const MAX_ALTITUDE = MAX_DISTANCE / GLOBE_RADIUS - 1;

const IDLE_ALTITUDE = 1.75;
// The dive: down to roughly 1,500 km above the stadium.
const DIVE_ALTITUDE = 0.24;
const DIVE_MS = 1500;
const RETREAT_MS = 1100;
// Where the camera rests before anything is chosen: over western Europe, where
// all but one of the finals were played.
const HOME_VIEW = { lat: 46, lng: 6, altitude: IDLE_ALTITUDE };

const AUTO_ROTATE_SPEED = 0.35; // about three minutes per revolution
// How long after the last hands-on moment the idle drift picks up again.
const AUTO_ROTATE_RESUME_MS = 7000;
// Each press of + / − moves the camera this fraction of the way in or out.
const ZOOM_STEP = 0.58;
const ZOOM_MS = 450;
// The other ways to zoom, named in the zoom buttons' tooltips — a plain mouse
// wheel is left to scroll the page (see the wheel listener below).
const ZOOM_GESTURE = "pinch, or hold Ctrl / ⌘ and scroll";

// How close (CSS px) a click must land to a beacon to count. The nearest
// beacon inside this radius wins, so the crowded north-west of Europe — five
// cities a few pixels apart from orbit — never has overlapping targets.
const PICK_RADIUS_PX = 30;
// A press that travels further than this is a drag (rotating the globe).
const DRAG_TOLERANCE_PX = 6;

const PULSE_SECONDS = 2.8;
const IGNITE_STAGGER_SECONDS = 0.08;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Stop a camera move that is still in flight, right where it is. Setting the
// view to itself does it: the library finishes the old move (jumping to its
// end) and then applies the view it was handed, all before the next frame.
function haltCamera(globe: GlobeMethods) {
  globe.pointOfView(globe.pointOfView(), 0);
}

// Every camera move goes through here. Left to itself the library ends an
// interrupted move by snapping to its destination and only then starts the
// next one — a one-frame jump whenever a second city is chosen mid-dive or a
// zoom button is pressed twice. Halting first makes the new move start from
// what is actually on screen.
function flyTo(
  globe: GlobeMethods,
  view: { lat?: number; lng?: number; altitude?: number },
  ms: number
) {
  haltCamera(globe);
  globe.pointOfView(view, ms);
}

interface FlightArc {
  kind: "trail" | "flight";
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

// --- Borders ----------------------------------------------------------------

interface BorderData {
  /** Every coordinate below is degrees × q. */
  q: number;
  /**
   * Polylines as [lng0, lat0, Δlng, Δlat, Δlng, Δlat, …]. A line that crosses
   * the antimeridian keeps counting: its longitude runs on past ±180°.
   */
  coast: number[][];
  borders: number[][];
}

interface BorderLayer {
  object: Group;
  coast: LineBasicMaterial;
  borders: LineBasicMaterial;
}

// A straight chord between two far-apart points dips inside the sphere, so
// long segments are split until each piece hugs the surface.
const MAX_SEGMENT_DEGREES = 2;

// Decode delta-encoded polylines into the vertex pairs THREE.LineSegments
// wants, on a sphere of the given radius. The lat/lng → xyz mapping is
// three-globe's own, so the lines register with its texture.
function buildLines(lines: number[][], q: number, radius: number): Float32Array {
  const positions: number[] = [];
  const push = (lat: number, lng: number) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((90 - lng) * Math.PI) / 180;
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  for (const line of lines) {
    let x = line[0];
    let y = line[1];
    for (let i = 2; i + 1 < line.length; i += 2) {
      const nextX = x + line[i];
      const nextY = y + line[i + 1];
      const lng = x / q;
      const lat = y / q;
      const dLng = nextX / q - lng;
      const dLat = nextY / q - lat;
      const pieces = Math.max(
        1,
        Math.ceil(Math.max(Math.abs(dLng), Math.abs(dLat)) / MAX_SEGMENT_DEGREES)
      );
      for (let piece = 0; piece < pieces; piece += 1) {
        const from = piece / pieces;
        const to = (piece + 1) / pieces;
        push(lat + dLat * from, lng + dLng * from);
        push(lat + dLat * to, lng + dLng * to);
      }
      x = nextX;
      y = nextY;
    }
  }
  return new Float32Array(positions);
}

function createBorderLayer(data: BorderData): BorderLayer {
  // Lifted a hair off the surface so the lines never z-fight the globe.
  const radius = GLOBE_RADIUS * 1.002;
  const material = (color: string) =>
    new LineBasicMaterial({ color, transparent: true, depthWrite: false });

  const coast = material("#e3c877");
  const borders = material("#a9afbf");
  const lines = (source: number[][], lineMaterial: LineBasicMaterial) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(buildLines(source, data.q, radius), 3)
    );
    return new LineSegments(geometry, lineMaterial);
  };

  const object = new Group();
  object.add(lines(data.borders, borders), lines(data.coast, coast));
  return { object, coast, borders };
}

// 0 from orbit, 1 at the bottom of a dive. The borders and the relief both
// come up with it: from far away the globe is a quiet black-and-gold ball, and
// the detail arrives as the earth image underneath runs out of its own.
const closeness = (altitude: number) => 1 - clamp((altitude - 0.3) / 1.4, 0, 1);

function fadeBorders(layer: BorderLayer, altitude: number) {
  const near = closeness(altitude);
  layer.coast.opacity = 0.3 + 0.5 * near;
  layer.borders.opacity = 0.08 + 0.42 * near;
}

const reliefIntensity = (altitude: number) => 0.4 + 0.6 * closeness(altitude);

function disposeBorderLayer(layer: BorderLayer) {
  layer.object.traverse((child) => {
    if (child instanceof LineSegments) child.geometry.dispose();
  });
  layer.coast.dispose();
  layer.borders.dispose();
}

// --- Component --------------------------------------------------------------

export interface CampaignGlobeProps {
  sites: readonly CampaignSite[];
  /** The campaign whose panel is open, if any — the camera dives to it. */
  activeCampaign: UclCampaignSummary | null;
  /** The last two campaigns visited: the flight path runs between them. */
  previousLocation: UclCampaignSummary | null;
  currentLocation: UclCampaignSummary | null;
  /** Site being pointed at — on the globe or on the timeline. */
  highlightedSite: string | null;
  /**
   * Width in px of the strip on the right that the story column covers (0 on
   * small screens). The globe is centred in what is left, so a city the camera
   * dives to lands in the middle of the visible globe, not under the panel.
   */
  panelInset: number;
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
  panelInset,
  paused,
  onSelectSite,
  onHighlightSite,
}: CampaignGlobeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const beacons = useRef(new Map<string, HTMLElement>());
  // The press in progress (or just released), to tell a click from a drag.
  const press = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const pointerDown = useRef(false);
  const borderLayerRef = useRef<BorderLayer | null>(null);
  // The material the library wraps the globe in; ours to dress once it exists.
  const surfaceMaterial = useRef<MeshPhongMaterial | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const hasDived = useRef(false);
  // Where the zoom buttons are heading, while that move is still in flight.
  const zoomGoal = useRef<{ altitude: number; until: number } | null>(null);

  const inView = useInView(rootRef, { margin: "160px 0px" });
  const reduceMotion = useReducedMotion() ?? false;

  // Client-only component, so the capability can be read up front.
  const [hasWebGL] = useState(supportsWebGL);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [borderLayer, setBorderLayer] = useState<BorderLayer | null>(null);
  // The visitor's choice from the control bar; until they make one, the globe
  // drifts unless they have asked their system for less motion.
  const [rotationChoice, setRotationChoice] = useState<boolean | null>(null);
  const autoRotate = rotationChoice ?? !reduceMotion;

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

  // --- Idle drift -----------------------------------------------------------
  // The globe turns slowly when nobody is using it. Any hands-on moment — a
  // press, a pinch, a button, choosing a campaign — stops it at once; it
  // resumes a few seconds after the last one. Driven imperatively: OrbitControls
  // owns the flag, and nothing on screen needs to re-render when it flips.

  const wantsDrift = autoRotate && activeCampaign === null;
  const wantsDriftRef = useRef(wantsDrift);

  const scheduleDrift = useCallback((delayMs: number) => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = wantsDriftRef.current;
    }, delayMs);
  }, []);

  const holdDrift = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (controls) controls.autoRotate = false;
    scheduleDrift(AUTO_ROTATE_RESUME_MS);
  }, [scheduleDrift]);

  useEffect(() => {
    const firstRun = wantsDriftRef.current === wantsDrift;
    wantsDriftRef.current = wantsDrift;
    if (!ready) return;

    const controls = globeRef.current?.controls();
    if (!controls) return;
    if (!wantsDrift) {
      window.clearTimeout(idleTimer.current);
      controls.autoRotate = false;
      return;
    }
    // Straight after the entrance the drift starts promptly; after a panel
    // closes it waits, like after any other interaction.
    scheduleDrift(firstRun ? 1600 : AUTO_ROTATE_RESUME_MS);
  }, [wantsDrift, ready, scheduleDrift]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // --- Setup ----------------------------------------------------------------

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    // globe.gl re-centres the orbit on the globe after every move, so a pan
    // (right-drag, two-finger slide) slides the camera and it swings back to
    // face the centre: the globe can be pushed around but never out of frame.
    controls.enablePan = true;
    controls.minDistance = MIN_DISTANCE;
    controls.maxDistance = MAX_DISTANCE;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    // Every hands-on gesture — drag, touch, pinch, wheel — stops the idle
    // drift as it begins, and restarts the wait for it as it ends.
    controls.addEventListener("start", holdDrift);
    controls.addEventListener("end", holdDrift);

    const renderer = globe.renderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // One finger: horizontal drags spin the globe, vertical swipes still
    // scroll the page. Two fingers pinch to zoom.
    renderer.domElement.style.touchAction = "pan-y";

    globe.scene().traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = object.material;
      if (material instanceof MeshPhongMaterial && material.map) {
        surfaceMaterial.current = material;
        // Sharper sampling where the surface curves away from the camera.
        material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        material.map.needsUpdate = true;
      }
    });

    globe.pointOfView(HOME_VIEW, 0);
    setReady(true);
  }, [holdDrift]);

  // The mouse wheel belongs to the page: an embedded globe that swallows every
  // scroll is a trap. Ctrl/⌘ + wheel (which is also what a trackpad pinch
  // sends) zooms; a plain wheel is stopped here, on its way down to the
  // canvas, so the page scrolls as usual.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
    };
    surface.addEventListener("wheel", handleWheel, { capture: true, passive: true });
    return () =>
      surface.removeEventListener("wheel", handleWheel, { capture: true });
  }, []);

  // The relief and the borders arrive after the globe itself, so neither ever
  // delays it; without them it is merely plainer up close.
  useEffect(() => {
    const globe = globeRef.current;
    const material = surfaceMaterial.current;
    if (!ready || !globe || !material) return;

    let live = true;
    const relief = new TextureLoader().load(EARTH_RELIEF, (texture) => {
      if (!live) return;
      texture.anisotropy = globe.renderer().capabilities.getMaxAnisotropy();
      material.bumpMap = texture;
      material.bumpScale = RELIEF_BUMP_SCALE;
      material.emissiveMap = texture;
      material.emissive.set(RELIEF_TINT);
      material.emissiveIntensity = reliefIntensity(globe.pointOfView().altitude);
      material.needsUpdate = true;
    });

    return () => {
      live = false;
      material.bumpMap = null;
      material.emissiveMap = null;
      material.needsUpdate = true;
      relief.dispose();
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();

    fetch(BORDERS_URL, { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: BorderData | null) => {
        if (!data || abort.signal.aborted) return;
        const layer = createBorderLayer(data);
        const altitude =
          globeRef.current?.pointOfView().altitude ?? IDLE_ALTITUDE;
        fadeBorders(layer, altitude);
        borderLayerRef.current = layer;
        setBorderLayer(layer);
      })
      .catch(() => undefined);

    return () => {
      abort.abort();
      if (borderLayerRef.current) {
        disposeBorderLayer(borderLayerRef.current);
        borderLayerRef.current = null;
      }
    };
  }, [ready]);

  const borderData = useMemo(
    () => (borderLayer ? [borderLayer] : []),
    [borderLayer]
  );

  // --- Camera ---------------------------------------------------------------

  // Keyed on the campaign's id and coordinates rather than the object, so a
  // refresh of the page's data doesn't fly the camera back to where it was.
  const diveId = activeCampaign?.id ?? null;
  const diveLat = activeCampaign?.lat ?? 0;
  const diveLng = activeCampaign?.lng ?? 0;

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !ready) return;

    if (diveId !== null) {
      hasDived.current = true;
      zoomGoal.current = null;
      flyTo(
        globe,
        { lat: diveLat, lng: diveLng, altitude: DIVE_ALTITUDE },
        reduceMotion ? 0 : DIVE_MS
      );
    } else if (
      hasDived.current &&
      globe.pointOfView().altitude < IDLE_ALTITUDE
    ) {
      // Panel closed: pull back up, staying above the last stop.
      zoomGoal.current = null;
      flyTo(globe, { altitude: IDLE_ALTITUDE }, reduceMotion ? 0 : RETREAT_MS);
    }
  }, [diveId, diveLat, diveLng, ready, reduceMotion]);

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
      paused && inView ? DIVE_MS + 200 : 0
    );
    return () => window.clearTimeout(timer);
  }, [inView, paused, ready]);

  // --- Control bar ----------------------------------------------------------

  const zoomBy = (factor: number) => {
    const globe = globeRef.current;
    if (!globe) return;
    holdDrift();
    // Quick presses add up: each starts from where the last one was heading,
    // not from wherever the camera has got to so far.
    const now = performance.now();
    const pending = zoomGoal.current;
    const from =
      pending && now < pending.until
        ? pending.altitude
        : globe.pointOfView().altitude;
    const altitude = clamp(from * factor, MIN_ALTITUDE, MAX_ALTITUDE);
    const ms = reduceMotion ? 0 : ZOOM_MS;
    zoomGoal.current = { altitude, until: now + ms };
    flyTo(globe, { altitude }, ms);
  };

  const toggleRotation = () => {
    const next = !autoRotate;
    setRotationChoice(next);
    // Answer the button straight away rather than after the idle pause.
    window.clearTimeout(idleTimer.current);
    const controls = globeRef.current?.controls();
    if (controls) controls.autoRotate = next && activeCampaign === null;
  };

  const resetView = () => {
    const globe = globeRef.current;
    if (!globe) return;
    holdDrift();
    zoomGoal.current = null;
    flyTo(globe, HOME_VIEW, reduceMotion ? 0 : RETREAT_MS);
  };

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
    if (pointerDown.current) {
      const pressed = press.current;
      if (
        pressed &&
        !pressed.dragged &&
        Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) >
          DRAG_TOLERANCE_PX
      ) {
        pressed.dragged = true;
        // A real drag takes the camera over from any move still in flight —
        // otherwise a dive would ignore the hand for a second and a half.
        zoomGoal.current = null;
        if (globeRef.current) haltCamera(globeRef.current);
      }
      return;
    }
    if (event.pointerType !== "mouse") return;
    const site = nearestSite(event.clientX, event.clientY);
    onHighlightSite(site ? site.key : null);
  };

  const handlePointerEnd = () => {
    pointerDown.current = false;
  };

  const pointing = highlightedSite !== null;

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 ${paused ? "ucl-globe--paused" : ""}`}
    >
      <div
        ref={surfaceRef}
        aria-hidden
        className="absolute inset-0 select-none"
        style={{ cursor: pointing ? "pointer" : "grab" }}
        onPointerDown={(event) => {
          pointerDown.current = true;
          press.current = { x: event.clientX, y: event.clientY, dragged: false };
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={() => onHighlightSite(null)}
        onClick={(event) => {
          const pressed = press.current;
          press.current = null;
          // Releasing after a drag still fires a click — ignore it.
          if (pressed?.dragged) return;
          const site = nearestSite(event.clientX, event.clientY);
          if (site) onSelectSite(site);
        }}
      >
        {hasWebGL && size ? (
          <Globe
            ref={globeRef}
            width={size.width}
            height={size.height}
            globeOffset={[-Math.round(panelInset / 2), 0]}
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
            onZoom={({ altitude }) => {
              if (borderLayerRef.current) {
                fadeBorders(borderLayerRef.current, altitude);
              }
              const material = surfaceMaterial.current;
              if (material?.emissiveMap) {
                material.emissiveIntensity = reliefIntensity(altitude);
              }
            }}
            customLayerData={borderData}
            customThreeObject={(layer: object) => (layer as BorderLayer).object}
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

      {/* Control bar. Outside the aria-hidden canvas: these are real buttons. */}
      {hasWebGL ? (
        <div
          role="group"
          aria-label="Globe controls"
          className={`absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-full border border-white/10 bg-[#0b0e16]/75 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md transition-opacity duration-500 lg:left-5 lg:right-auto ${
            ready ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <HudButton
            label="Zoom in"
            hint={`Zoom in — or ${ZOOM_GESTURE}`}
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            <Plus aria-hidden className="h-4 w-4" />
          </HudButton>
          <HudButton
            label="Zoom out"
            hint={`Zoom out — or ${ZOOM_GESTURE}`}
            onClick={() => zoomBy(1 / ZOOM_STEP)}
          >
            <Minus aria-hidden className="h-4 w-4" />
          </HudButton>
          <HudButton
            label="Auto-rotate"
            hint={autoRotate ? "Stop the globe turning" : "Let the globe turn"}
            pressed={autoRotate}
            onClick={toggleRotation}
          >
            {autoRotate ? (
              <Pause aria-hidden className="h-4 w-4" />
            ) : (
              <Play aria-hidden className="h-4 w-4" />
            )}
          </HudButton>
          <HudButton label="Reset to the world view" onClick={resetView}>
            <Earth aria-hidden className="h-4 w-4" />
          </HudButton>
        </div>
      ) : null}
    </div>
  );
}

function HudButton({
  label,
  hint = label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  /** Tooltip, when it should say more than the label. */
  hint?: string;
  /** Set for the toggle; leaves the others as plain buttons. */
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={hint}
      className={`flex h-11 w-11 items-center justify-center border-t border-white/[0.08] outline-none transition-colors first:border-t-0 hover:bg-white/[0.08] hover:text-[#F1DD96] focus-visible:bg-white/[0.12] focus-visible:text-[#F1DD96] ${
        pressed ? "text-[#F1DD96]" : "text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

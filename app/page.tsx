"use client";

import { Italiana } from "next/font/google";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { useRouter } from "next/navigation";
import { Delaunay } from "d3-delaunay";

const italiana = Italiana({ subsets: ["latin"], weight: "400" });

type NodeStyle = CSSProperties & { "--node-index"?: number };

const portalCategories = [
  { href: "/about", title: "About" },
  { href: "/art", title: "Art" },
  { href: "/music", title: "Music" },
  { href: "/graphics", title: "Graphics" },
  { href: "/poems", title: "Poems" },
  { href: "/photos", title: "Photos" }
] as const;

type DiagramCell = {
  href: string;
  title: string;
  path: string;
  label: { x: number; y: number };
  area: number;
};

type PortalNodeEntry = {
  path: SVGPathElement | null;
  text: SVGTextElement | null;
  hitbox: SVGCircleElement | null;
};

const MIN_NODE_HITBOX = 12;
const MAX_NODE_HITBOX_RATIO = 0.06;

const createRng = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

type PolygonMetrics = {
  centroid: [number, number];
  area: number;
};

const polygonMetrics = (points: Array<[number, number]>): PolygonMetrics => {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-5) {
    const sum = points.reduce<[number, number]>(
      (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]],
      [0, 0]
    );
    return {
      centroid: [sum[0] / n, sum[1] / n],
      area: 0
    };
  }
  return {
    centroid: [cx / (6 * area), cy / (6 * area)],
    area: Math.abs(area)
  };
};

const polygonPathFromPoints = (points: Array<[number, number]>) =>
  points
    .map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ") + "Z";

export default function HomePage() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });
  const pointerEnergyRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  const meshPathRef = useRef<SVGPathElement | null>(null);
  const nodeRefs = useRef<Record<string, PortalNodeEntry>>({});
  const delaunayRef = useRef<Delaunay | null>(null);
  const voronoiRef = useRef<ReturnType<Delaunay["voronoi"]> | null>(null);
  const svgBoundsRef = useRef({ width: 1, height: 1 });

  const [svgBounds, setSvgBounds] = useState({ width: 1, height: 1 });

  const ensureNodeEntry = useCallback((href: string) => {
    if (!nodeRefs.current[href]) {
      nodeRefs.current[href] = { path: null, text: null, hitbox: null };
    }
    return nodeRefs.current[href];
  }, []);

  useEffect(() => {
    svgBoundsRef.current = svgBounds;
  }, [svgBounds]);

  const prefersStatic = useMemo(
    () =>
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    []
  );
  const router = useRouter();

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const TYPE_CATEGORY = 0;
    const TYPE_SPOKE_INNER = 1;
    const TYPE_SPOKE_OUTER = 2;
    const TYPE_FRAME = 3;
    const TYPE_DRIFT = 4;

    const rng = createRng(42);
    const spokeCount = 30;
    const spokeLevels = [0.56, 0.86, 1.1] as const;
    const framePositions: Array<[number, number]> = [
      [0.5, 0],
      [1, 0.23],
      [1, 0.74],
      [0.5, 1],
      [0, 0.74],
      [0, 0.23],
      [0.18, 0],
      [0.82, 1]
    ];
    const framePoints = framePositions.length;
    const driftPoints = 16;

    const pointerState = pointerRef.current;

    board.style.setProperty("--cursor-active", "0");
    board.style.setProperty("--cursor-x", "50%");
    board.style.setProperty("--cursor-y", "50%");
    board.style.setProperty("--cursor-energy", "0");
    board.style.setProperty("--mesh-alpha", "0.32");

    const handlePointerMove = (event: PointerEvent) => {
      const rect = board.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerState.x = Math.min(Math.max(x, 0), 1);
      pointerState.y = Math.min(Math.max(y, 0), 1);
      pointerState.active = true;
      board.style.setProperty("--cursor-x", `${pointerState.x * 100}%`);
      board.style.setProperty("--cursor-y", `${pointerState.y * 100}%`);
      board.style.setProperty("--cursor-active", "1");
    };

    const handlePointerLeave = () => {
      pointerState.active = false;
      pointerEnergyRef.current = 0;
      board.style.setProperty("--cursor-active", "0");
      board.style.setProperty("--cursor-energy", "0");
    };

    board.addEventListener("pointermove", handlePointerMove);
    board.addEventListener("pointerdown", handlePointerMove);
    board.addEventListener("pointerleave", handlePointerLeave);

    const totalPoints =
      portalCategories.length + spokeCount * spokeLevels.length + framePoints + driftPoints;
    const points = new Float64Array(totalPoints * 2);
    const velocities = new Float64Array(totalPoints * 2);
    const phaseOffsets = new Float64Array(totalPoints);
    const baseAngles = new Float64Array(totalPoints);
    const baseRadii = new Float64Array(totalPoints);
    const speedScales = new Float64Array(totalPoints);
    const pointTypes = new Uint8Array(totalPoints);
    const perpX = new Float64Array(totalPoints);
    const perpY = new Float64Array(totalPoints);
    const baseX = new Float64Array(totalPoints);
    const baseY = new Float64Array(totalPoints);
    const spokeIds = new Int16Array(totalPoints);
    const spokeProgress = new Float64Array(totalPoints);
    spokeIds.fill(-1);

    const updateSize = () => {
      const rect = board.getBoundingClientRect();
      sizeRef.current = {
        width: rect.width || 1,
        height: rect.height || 1
      };
    };

    const assignPoint = (idx: number, x: number, y: number) => {
      points[idx * 2] = x;
      points[idx * 2 + 1] = y;
      baseX[idx] = x;
      baseY[idx] = y;
    };

    const seedPoints = () => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const minDim = Math.min(width, height);
      const diagRadius = Math.hypot(width, height) * 0.5;
      const centerX = width / 2;
      const centerY = height / 2;
      let index = 0;

      const anchorRadius = minDim * 0.3;
      for (let i = 0; i < portalCategories.length; i++, index++) {
        pointTypes[index] = TYPE_CATEGORY;
        const angle = (i / portalCategories.length) * Math.PI * 2 - Math.PI / 2;
        const jitter = minDim * 0.028;
        baseAngles[index] = angle;
        baseRadii[index] = anchorRadius * (0.95 + rng() * 0.12);
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.65 + rng() * 0.38;
        velocities[index * 2] = 0;
        velocities[index * 2 + 1] = 0;
        const px =
          centerX + Math.cos(angle) * baseRadii[index] + (rng() - 0.5) * jitter;
        const py =
          centerY + Math.sin(angle) * baseRadii[index] + (rng() - 0.5) * jitter;
        assignPoint(index, px, py);
      }

      const baseRotation = rng() * Math.PI * 2;
      for (let spoke = 0; spoke < spokeCount; spoke++) {
        const angle = baseRotation + (spoke / spokeCount) * Math.PI * 2;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const perpVecX = -sinAngle;
        const perpVecY = cosAngle;

        for (let levelIndex = 0; levelIndex < spokeLevels.length; levelIndex++, index++) {
          const level = spokeLevels[levelIndex] * (0.94 + rng() * 0.05);
          const radius = diagRadius * level;
          const lateralJitter = minDim * (0.008 + levelIndex * 0.004);
          const alongJitter = minDim * 0.008;
          const perpOffset = (rng() - 0.5) * lateralJitter;
          const alongOffset = (rng() - 0.5) * alongJitter;
          const px =
            centerX + cosAngle * (radius + alongOffset) + perpVecX * perpOffset;
          const py =
            centerY + sinAngle * (radius + alongOffset) + perpVecY * perpOffset;
          assignPoint(index, px, py);
          pointTypes[index] = levelIndex < spokeLevels.length - 1 ? TYPE_SPOKE_INNER : TYPE_SPOKE_OUTER;
          spokeProgress[index] =
            spokeLevels.length > 1 ? levelIndex / (spokeLevels.length - 1) : 0;
          baseAngles[index] = angle;
          baseRadii[index] = radius;
          phaseOffsets[index] = rng() * Math.PI * 2;
          speedScales[index] = 0.45 + rng() * 0.64;
          velocities[index * 2] = 0;
          velocities[index * 2 + 1] = 0;
          perpX[index] = perpVecX;
          perpY[index] = perpVecY;
          spokeIds[index] = spoke;
        }
      }

      framePositions.forEach(([xRatio, yRatio]) => {
        if (index >= totalPoints) return;
        const px = width * xRatio;
        const py = height * yRatio;
        assignPoint(index, px, py);
        pointTypes[index] = TYPE_FRAME;
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.24 + rng() * 0.28;
        velocities[index * 2] = 0;
        velocities[index * 2 + 1] = 0;
        index += 1;
      });

      for (; index < totalPoints; index++) {
        pointTypes[index] = TYPE_DRIFT;
        const px = rng() * width;
        const py = rng() * height;
        assignPoint(index, px, py);
        velocities[index * 2] = (rng() - 0.5) * 0.2;
        velocities[index * 2 + 1] = (rng() - 0.5) * 0.2;
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.3 + rng() * 0.4;
        perpX[index] = 0;
        perpY[index] = 0;
      }
    };

    const rebuildTriangulation = () => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const delaunay = new Delaunay(points);
      delaunayRef.current = delaunay;
      voronoiRef.current = delaunay.voronoi([0, 0, width, height]);
    };

    type DiagramSnapshot = {
      meshPath: string | null;
      cells: DiagramCell[];
      width: number;
      height: number;
    };

    const updateSvgElements = (snapshot: DiagramSnapshot, refreshMesh: boolean) => {
      const { width, height } = snapshot;
      const currentBounds = svgBoundsRef.current;
      if (
        Math.abs(currentBounds.width - width) > 0.5 ||
        Math.abs(currentBounds.height - height) > 0.5
      ) {
        const nextBounds = { width, height };
        svgBoundsRef.current = nextBounds;
        setSvgBounds(nextBounds);
      }

      if (refreshMesh && snapshot.meshPath !== null) {
        const meshPathElement = meshPathRef.current;
        if (meshPathElement) {
          meshPathElement.setAttribute("d", snapshot.meshPath);
        }
      }

      const minDim = Math.min(width, height);
      const maxRadius = Math.max(MIN_NODE_HITBOX, minDim * MAX_NODE_HITBOX_RATIO);

      snapshot.cells.forEach((cell) => {
        const entry = ensureNodeEntry(cell.href);
        if (entry.path) {
          entry.path.setAttribute("d", cell.path);
        }
        if (entry.text) {
          entry.text.setAttribute("x", cell.label.x.toFixed(1));
          entry.text.setAttribute("y", (cell.label.y - minDim * 0.006).toFixed(1));
        }
        if (entry.hitbox) {
          entry.hitbox.setAttribute("cx", cell.label.x.toFixed(1));
          entry.hitbox.setAttribute("cy", cell.label.y.toFixed(1));
          const derivedRadius =
            cell.area > 0 ? Math.sqrt(cell.area / Math.PI) * 0.24 : minDim * 0.03;
          const radius = Math.max(MIN_NODE_HITBOX, Math.min(maxRadius, derivedRadius));
          entry.hitbox.setAttribute("r", radius.toFixed(1));
        }
      });
    };

    const buildDiagram = (refreshMesh: boolean): DiagramSnapshot | null => {
      const { width, height } = sizeRef.current;
      const voronoi = voronoiRef.current;
      if (!width || !height || !voronoi) return null;

      voronoi.xmin = 0;
      voronoi.ymin = 0;
      voronoi.xmax = width;
      voronoi.ymax = height;
      voronoi.update();

      const meshPath = refreshMesh ? voronoi.render() ?? "" : null;
      const cells: DiagramCell[] = [];
      portalCategories.forEach((category, index) => {
        const polygon = voronoi.cellPolygon(index);
        if (!polygon || polygon.length < 6) return;
        const typed = polygon as Array<[number, number]>;
        const { centroid, area } = polygonMetrics(typed);
        const path = polygonPathFromPoints(typed);
        cells.push({
          ...category,
          path,
          label: { x: centroid[0], y: centroid[1] },
          area
        });
      });

      return { meshPath, cells, width, height };
    };

    const pushDiagram = (refreshMesh: boolean) => {
      const snapshot = buildDiagram(refreshMesh);
      if (snapshot) {
        updateSvgElements(snapshot, refreshMesh);
      }
    };

    updateSize();
    seedPoints();
    rebuildTriangulation();
    pushDiagram(true);

    if (!prefersStatic) {
      let lastFrame = 0;
      let lastDiagramUpdate = 0;
      let lastMeshUpdate = 0;
      const animate = (time: number) => {
        const { width, height } = sizeRef.current;
        if (!width || !height) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        if (!lastFrame) lastFrame = time;
        const deltaTime = Math.max(0.001, (time - lastFrame) / 1000);
        lastFrame = time;

        const t = time * 0.00016;
        const centerX = width / 2;
        const centerY = height / 2;
        const minDim = Math.min(width, height);
        const pointerStateCurrent = pointerRef.current;
        const pointerActive = pointerStateCurrent.active;
        const pointerX = pointerStateCurrent.x * width;
        const pointerY = pointerStateCurrent.y * height;
        const pointerFalloff = minDim * minDim * 0.2;
        const pointerInfluenceCap = pointerActive ? 1 : 0;
        let pointerHighlight = pointerEnergyRef.current * 0.82;

        for (let i = 0; i < totalPoints; i++) {
          const idx = i * 2;
          const phase = phaseOffsets[i];
          const angleBase = baseAngles[i];
          const radiusBase = baseRadii[i];
          const type = pointTypes[i];

          if (type === TYPE_CATEGORY) {
            const breathing = 1 + Math.sin(t * 0.9 + phase) * 0.05;
            const swirl = Math.sin(t * 0.62 + phase * 1.1) * 0.18;
            const angle = angleBase + swirl * 0.55;
            const wobble = radiusBase * 0.05;
            let nextX =
              centerX +
              Math.cos(angle) * radiusBase * breathing +
              Math.cos(phase + t * 2.1) * wobble;
            let nextY =
              centerY +
              Math.sin(angle) * radiusBase * breathing +
              Math.sin(phase + t * 2.1) * wobble;
            if (pointerActive) {
              const dx = nextX - pointerX;
              const dy = nextY - pointerY;
              const drift = Math.exp(-(dx * dx + dy * dy) / pointerFalloff);
              nextX += dx * 0.028 * drift;
              nextY += dy * 0.028 * drift;
              pointerHighlight = Math.max(pointerHighlight, drift * pointerInfluenceCap);
            }
            points[idx] = nextX;
            points[idx + 1] = nextY;
          } else if (type === TYPE_SPOKE_INNER || type === TYPE_SPOKE_OUTER) {
            const progress = spokeProgress[i];
            const twistMagnitude = type === TYPE_SPOKE_INNER ? 0.1 : 0.15;
            const radialMagnitude = type === TYPE_SPOKE_INNER ? 0.042 : 0.068;
            const swayMagnitude = type === TYPE_SPOKE_INNER ? 0.0075 : 0.011;
            const twist =
              Math.sin(t * (type === TYPE_SPOKE_INNER ? 0.58 : 0.44) + phase + progress * 3) *
              twistMagnitude;
            const angle = angleBase + twist;
            const radialPulse =
              1 + Math.sin(t * 0.48 + phase + progress * 2.2) * radialMagnitude;
            const sway =
              Math.sin(t * 0.68 + phase + spokeIds[i] * 0.38 + progress * 3) *
              minDim *
              swayMagnitude;
            const radius = radiusBase * radialPulse;
            let nextX = centerX + Math.cos(angle) * radius + perpX[i] * sway;
            let nextY = centerY + Math.sin(angle) * radius + perpY[i] * sway;
            if (pointerActive) {
              const dx = nextX - pointerX;
              const dy = nextY - pointerY;
              const drift = Math.exp(-(dx * dx + dy * dy) / pointerFalloff);
              nextX += dx * 0.04 * drift;
              nextY += dy * 0.04 * drift;
              pointerHighlight = Math.max(pointerHighlight, drift * pointerInfluenceCap);
            }
            points[idx] = nextX;
            points[idx + 1] = nextY;
          } else if (type === TYPE_FRAME) {
            const basePx = baseX[i];
            const basePy = baseY[i];
            const tension = 1 + Math.sin(t * 0.33 + phase) * 0.042;
            const pullX = centerX + (basePx - centerX) * tension;
            const pullY = centerY + (basePy - centerY) * tension;
            points[idx] = Math.min(Math.max(pullX, 0), width);
            points[idx + 1] = Math.min(Math.max(pullY, 0), height);
          } else if (type === TYPE_DRIFT) {
            const accelX = Math.sin(t * 1.08 + phase) * 0.0014 * speedScales[i];
            const accelY = Math.cos(t * 1.02 + phase) * 0.0014 * speedScales[i];
            velocities[idx] += accelX * deltaTime * 60;
            velocities[idx + 1] += accelY * deltaTime * 60;
            points[idx] += velocities[idx];
            points[idx + 1] += velocities[idx + 1];

            if (points[idx] <= 2 || points[idx] >= width - 2) {
              velocities[idx] *= -0.9;
              points[idx] = Math.min(Math.max(points[idx], 2), width - 2);
            }
            if (points[idx + 1] <= 2 || points[idx + 1] >= height - 2) {
              velocities[idx + 1] *= -0.9;
              points[idx + 1] = Math.min(Math.max(points[idx + 1], 2), height - 2);
            }

            velocities[idx] = Math.max(Math.min(velocities[idx], 0.22), -0.22);
            velocities[idx + 1] = Math.max(Math.min(velocities[idx + 1], 0.22), -0.22);
          }
        }

        const now = time;
        const diagramInterval = pointerActive ? 48 : 90;
        const meshInterval = pointerActive ? 80 : 150;
        const refreshMesh = now - lastMeshUpdate > meshInterval;
        if (refreshMesh || now - lastDiagramUpdate > diagramInterval) {
          pushDiagram(refreshMesh);
          lastDiagramUpdate = now;
          if (refreshMesh) lastMeshUpdate = now;
        }

        const currentEnergy = pointerEnergyRef.current;
        const targetEnergy = pointerActive
          ? Math.max(pointerHighlight, currentEnergy * 0.8)
          : currentEnergy * 0.9;
        const clampedEnergy = Math.min(1, targetEnergy);
        pointerEnergyRef.current = clampedEnergy;
        board.style.setProperty("--cursor-energy", clampedEnergy.toFixed(3));
        board.style.setProperty("--mesh-alpha", (0.32 + clampedEnergy * 0.36).toFixed(3));

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      pointerEnergyRef.current = 0;
      board.style.setProperty("--cursor-energy", "0");
      board.style.setProperty("--mesh-alpha", "0.32");
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      seedPoints();
      rebuildTriangulation();
      pushDiagram(true);
    });
    resizeObserver.observe(board);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      delaunayRef.current = null;
      voronoiRef.current = null;
      resizeObserver.disconnect();
      board.removeEventListener("pointermove", handlePointerMove);
      board.removeEventListener("pointerdown", handlePointerMove);
      board.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [prefersStatic, ensureNodeEntry]);

  const viewBoxWidth = Math.max(1, svgBounds.width);
  const viewBoxHeight = Math.max(1, svgBounds.height);

  return (
    <section className="portal">
      <div ref={boardRef} className="portal-board">
        <svg
          className="portal-svg"
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
        >
          <path ref={meshPathRef} className="portal-mesh" d="" />
          {portalCategories.map((category, index) => (
            <g
              style={{ "--node-index": index } as NodeStyle}
              key={category.href}
              tabIndex={0}
              role="link"
              className="portal-node"
              aria-label={category.title}
              onClick={() => router.push(category.href)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(category.href);
                }
              }}
            >
              <circle
                ref={(node) => {
                  const entry = ensureNodeEntry(category.href);
                  entry.hitbox = node;
                }}
                className="portal-node__hitbox"
                cx="0"
                cy="0"
                r={MIN_NODE_HITBOX}
              />
              <path
                ref={(node) => {
                  const entry = ensureNodeEntry(category.href);
                  entry.path = node;
                }}
                className="portal-node__shape"
                d=""
              />
              <text
                ref={(node) => {
                  const entry = ensureNodeEntry(category.href);
                  entry.text = node;
                }}
                className="portal-node__title"
                x="0"
                y="0"
              >
                {category.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="portal-content">
        <h1 className={`portal-title ${italiana.className}`}>luke white</h1>
      </div>
    </section>
  );
}

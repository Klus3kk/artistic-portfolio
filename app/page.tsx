"use client";

import { Italiana } from "next/font/google";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Delaunay } from "d3-delaunay";

// Best font ever ;P
const italiana = Italiana({ subsets: ["latin"], weight: "400" });

// Type for inline styles with custom property
type NodeStyle = CSSProperties & { "--node-index"?: number };

// Define the categories for the portal
const portalCategories = [
  {
    href: "/about",
    title: "About",
  },
  {
    href: "/art",
    title: "Art",
  },
  {
    href: "/music",
    title: "Music",
  },
  {
    href: "/graphics",
    title: "Graphics",
  },
  {
    href: "/poems",
    title: "Poems",
  },
  {
    href: "/photos",
    title: "Photos",
  }
] as const;

// Types for the diagram state and cells
type DiagramCell = {
  href: string;
  title: string;
  path: string;
  label: { x: number; y: number };
};

// State of the entire diagram
type DiagramState = {
  meshPath: string;
  cells: DiagramCell[];
  width: number;
  height: number;
};

// Simple seeded RNG (Park-Miller / "minimal standard") for reproducible randomness
const createRng = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

// Centroid calculation adapted from https://observablehq.com/@d3/polygon-centroid (hippity hoppity your code is now my property)
const polygonCentroid = (points: Array<[number, number]>): [number, number] => {
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
    const sum = points.reduce<[number, number]>((acc, curr) => [acc[0] + curr[0], acc[1] + curr[1]], [0, 0]);
    return [sum[0] / n, sum[1] / n];
  }
  return [cx / (6 * area), cy / (6 * area)];
};

// Main homepage component
export default function HomePage() {
  const boardRef = useRef<HTMLDivElement | null>(null); // The main interactive board element
  const animationRef = useRef<number | null>(null); // Reference to the animation frame
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false }); // Pointer state
  const pointerEnergyRef = useRef(0); // Pointer energy for interaction effects
  // Size reference to track board dimensions
  const sizeRef = useRef({ width: 0, height: 0 });
  const [diagram, setDiagram] = useState<DiagramState | null>(null); // Current diagram state
  // Detect if user prefers reduced motion for accessibility
  const prefersStatic = useMemo( 
    () => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false), 
    []
  );
  const router = useRouter(); // Next.js router for navigation

  // Main layout effect to set up the interactive diagram
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const TYPE_CATEGORY = 0;
    const TYPE_SPOKE_INNER = 1;
    const TYPE_SPOKE_OUTER = 2;
    const TYPE_FRAME = 3;
    const TYPE_DRIFT = 4;

    const rng = createRng(42);
    const spokeCount = 41 as const; // prime number -> fewer moiré/banding artifacts

    // Equal-area rings: r_k ≈ sqrt((k+0.5)/L) spreads sites uniformly by area.
    // maxRadius > 1 lets you sample slightly beyond the viewport to avoid edge voids.
    const spokeLevels = (() => {
      const L = 5;
      const maxRadius = 1.05; 
      return Array.from({ length: L }, (_, k) =>
        Math.sqrt((k + 0.5) / L) * maxRadius
      );
    })();
    const pointerState = pointerRef.current; // Current pointer state

    // Initialize CSS variables for cursor and mesh appearance
    board.style.setProperty("--cursor-active", "0"); // 0 to 1
    board.style.setProperty("--cursor-x", "50%"); // 0% to 100%
    board.style.setProperty("--cursor-y", "50%"); // 0% to 100%
    board.style.setProperty("--cursor-energy", "0"); // 0 to ~1
    board.style.setProperty("--mesh-alpha", "0.32"); // 0.32 to ~0.7
    const handlePointerMove = (event: PointerEvent) => {  // Update pointer position and state
      const rect = board.getBoundingClientRect(); 
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      pointerState.x = Math.min(Math.max(x, 0), 1);
      pointerState.y = Math.min(Math.max(y, 0), 1);
      pointerState.active = true;
      board.style.setProperty("--cursor-x", `${pointerState.x * 100}%`); // Update CSS variable for cursor X position
      board.style.setProperty("--cursor-y", `${pointerState.y * 100}%`); // Update CSS variable for cursor Y position
      board.style.setProperty("--cursor-active", "1"); // Set cursor as active
    };
    // Handle pointer leaving the board area
    const handlePointerLeave = () => {
      pointerState.active = false;
      pointerEnergyRef.current = 0;
      board.style.setProperty("--cursor-active", "0");
      board.style.setProperty("--cursor-energy", "0");
    };
    // Attach pointer event listeners
    board.addEventListener("pointermove", handlePointerMove);
    board.addEventListener("pointerdown", handlePointerMove);
    board.addEventListener("pointerleave", handlePointerLeave);

    // Total points: categories + spokes + frame + drift
    const framePoints = 8; // must be >= 6
    const driftPoints = 14; // must be >= 6
    const totalPoints = portalCategories.length + spokeCount * spokeLevels.length + framePoints + driftPoints;
    const points = new Float64Array(totalPoints * 2);
    const velocities = new Float64Array(totalPoints * 2);
    const phaseOffsets = new Float64Array(totalPoints);
    const baseAngles = new Float64Array(totalPoints);
    const baseRadii = new Float64Array(totalPoints);
    const speedScales = new Float64Array(totalPoints);
    const pointTypes = new Uint8Array(totalPoints); // 0=category,1=inner spoke,2=outer spoke,3=frame,4=drift
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

    // Seed initial point positions and attributes
    const seedPoints = () => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const minDim = Math.min(width, height);
      const diagRadius = Math.hypot(width, height) * 0.5;
      const centerX = width / 2;
      const centerY = height / 2;
      let index = 0;

      const assignPoint = (idx: number, x: number, y: number) => {
        points[idx * 2] = x;
        points[idx * 2 + 1] = y;
        baseX[idx] = x;
        baseY[idx] = y;
      };

      // Anchor category facets close to the hub.
      const anchorRadius = minDim * 0.32;
      for (let i = 0; i < portalCategories.length; i++, index++) {
        pointTypes[index] = 0;
        const angle = (i / portalCategories.length) * Math.PI * 2 - Math.PI / 2;
        const jitter = minDim * 0.05;
        baseAngles[index] = angle;
        baseRadii[index] = anchorRadius * (0.92 + rng() * 0.16);
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.7 + rng() * 0.5;
        velocities[index * 2] = 0;
        velocities[index * 2 + 1] = 0;
        const px =
          centerX + Math.cos(angle) * baseRadii[index] + (rng() - 0.5) * jitter;
        const py =
          centerY + Math.sin(angle) * baseRadii[index] + (rng() - 0.5) * jitter;
        assignPoint(index, px, py);
      }

      // Radial spokes reaching toward the viewport edges.
      const baseRotation = rng() * Math.PI * 2;
      for (let spoke = 0; spoke < spokeCount; spoke++) {
        const angle = baseRotation + (spoke / spokeCount) * Math.PI * 2;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const perpVecX = -sinAngle;
        const perpVecY = cosAngle;

        // Place points along this spoke.
        for (let levelIndex = 0; levelIndex < spokeLevels.length; levelIndex++, index++) {
          const level = spokeLevels[levelIndex] * (0.94 + rng() * 0.1);
          const radius = diagRadius * level;
          const lateralJitter = minDim * (0.012 + levelIndex * 0.008);
          const alongJitter = minDim * 0.01;
          const perpOffset = (rng() - 0.5) * lateralJitter;
          const alongOffset = (rng() - 0.5) * alongJitter;
          const px = centerX + cosAngle * (radius + alongOffset) + perpVecX * perpOffset;
          const py = centerY + sinAngle * (radius + alongOffset) + perpVecY * perpOffset;
          assignPoint(index, px, py);
          pointTypes[index] = levelIndex < spokeLevels.length - 2 ? 1 : 2;
          spokeProgress[index] = spokeLevels.length > 1 ? levelIndex / (spokeLevels.length - 1) : 0;
          baseAngles[index] = angle;
          baseRadii[index] = radius;
          phaseOffsets[index] = rng() * Math.PI * 2;
          speedScales[index] = 0.5 + rng() * 0.8;
          velocities[index * 2] = 0;
          velocities[index * 2 + 1] = 0;
          perpX[index] = perpVecX;
          perpY[index] = perpVecY;
          spokeIds[index] = spoke;
        }
      }

      // Frame points hug the perimeter to pull strands to the walls.
      // Must have at least 6 to form a closed shape.
      // They don't need to be very accurate since the Voronoi will interpolate.
      if (framePoints < 6) throw new Error("framePoints must be at least 6");

      // Place frame points in an even-ish distribution.
      const framePositions: Array<[number, number]> = [
        [0.5, 0],
        [1, 0.22],
        [1, 0.68],
        [0.5, 1],
        [0, 0.68],
        [0, 0.22],
        [0.18, 0],
        [0.82, 1]
      ];

      // Add jitter if we have more points than positions.
      framePositions.forEach(([xRatio, yRatio]) => {
        if (index >= totalPoints) return;
        const px = width * xRatio;
        const py = height * yRatio;
        assignPoint(index, px, py);
        pointTypes[index] = 3;
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.3 + rng() * 0.3;
        velocities[index * 2] = 0;
        velocities[index * 2 + 1] = 0;
        index += 1;
      });

      // Drifting points add subtle mesh deformation.
      for (; index < totalPoints; index++) {
        pointTypes[index] = 4;
        const px = rng() * width;
        const py = rng() * height;
        assignPoint(index, px, py);
        velocities[index * 2] = (rng() - 0.5) * 0.24;
        velocities[index * 2 + 1] = (rng() - 0.5) * 0.24;
        phaseOffsets[index] = rng() * Math.PI * 2;
        speedScales[index] = 0.35 + rng() * 0.45;
        perpX[index] = 0;
        perpY[index] = 0;
      }
    };

    // Build the Voronoi diagram and extract paths and cell data
    const buildDiagram = (): DiagramState | null => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return null;

      const delaunay = Delaunay.from(
        { length: totalPoints },
        (_, idx) => points[idx * 2],
        (_, idx) => points[idx * 2 + 1]
      );
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      const meshPath = voronoi.render();

      const cells: DiagramCell[] = [];
      portalCategories.forEach((category, index) => {
        const polygon = voronoi.cellPolygon(index);
        if (!polygon || polygon.length < 3) return;
        const typed = polygon as Array<[number, number]>;
        const centroid = polygonCentroid(typed);
        const path = typed
          .map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(" ") + "Z";
        cells.push({
          ...category,
          path,
          label: { x: centroid[0], y: centroid[1] }
        });
      });

      return { meshPath, cells, width, height };
    };

    const pushDiagram = () => {
      const snapshot = buildDiagram();
      if (snapshot) {
        setDiagram(snapshot);
      }
    };

    updateSize();
    seedPoints();
    pushDiagram();

    // Animation loop to update point positions and diagram
    if (!prefersStatic) {
      let lastUpdate = 0;
      const animate = (time: number) => {
        const { width, height } = sizeRef.current;
        if (!width || !height) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        if (!lastUpdate) lastUpdate = time;
        // Time in milliseconds -> seconds
        // Yeah...this some math right here, I didn't write that lol, I just copy/pasted it, no way I'm that smart :)
        const t = time * 0.00018;
        const centerX = width / 2;
        const centerY = height / 2;
        const minDim = Math.min(width, height);
        const pointerState = pointerRef.current;
        const pointerActive = pointerState.active;
        const pointerX = pointerState.x * width;
        const pointerY = pointerState.y * height;
        const pointerFalloff = minDim * minDim * 0.22;
        let pointerHighlight = pointerEnergyRef.current * 0.85;
        for (let i = 0; i < totalPoints; i++) {
          const idx = i * 2;
          const phase = phaseOffsets[i];
          const angleBase = baseAngles[i];
          const radiusBase = baseRadii[i];
          const type = pointTypes[i];

          if (type === TYPE_CATEGORY) {
            const breathing = 1 + Math.sin(t * 0.9 + phase) * 0.05;
            const swirl = Math.sin(t * 0.7 + phase * 1.1) * 0.22;
            const angle = angleBase + swirl * 0.6;
            const wobble = radiusBase * 0.055;
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
              const influence = Math.exp(-(dx * dx + dy * dy) / pointerFalloff);
              nextX += dx * 0.032 * influence;
              nextY += dy * 0.032 * influence;
              pointerHighlight = Math.max(pointerHighlight, influence);
            }
            points[idx] = nextX;
            points[idx + 1] = nextY;
          } else if (type === TYPE_SPOKE_INNER || type === TYPE_SPOKE_OUTER) {
            const progress = spokeProgress[i];
            const twistMagnitude = type === TYPE_SPOKE_INNER ? 0.12 : 0.18;
            const radialMagnitude = type === TYPE_SPOKE_INNER ? 0.05 : 0.08;
            const swayMagnitude = type === TYPE_SPOKE_INNER ? 0.009 : 0.014;
            const twist =
              Math.sin(t * (type === TYPE_SPOKE_INNER ? 0.6 : 0.45) + phase + progress * 3.2) * twistMagnitude;
            const angle = angleBase + twist;
            const radialPulse =
              1 + Math.sin(t * 0.52 + phase + progress * 2.4) * radialMagnitude;
            const sway =
              Math.sin(t * 0.72 + phase + spokeIds[i] * 0.42 + progress * 3.1) * minDim * swayMagnitude;
            const radius = radiusBase * radialPulse;
            let nextX = centerX + Math.cos(angle) * radius + perpX[i] * sway;
            let nextY = centerY + Math.sin(angle) * radius + perpY[i] * sway;
            if (pointerActive) {
              const dx = nextX - pointerX;
              const dy = nextY - pointerY;
              const influence = Math.exp(-(dx * dx + dy * dy) / pointerFalloff) * (type === TYPE_SPOKE_INNER ? 0.9 : 1);
              nextX += dx * 0.05 * influence;
              nextY += dy * 0.05 * influence;
              pointerHighlight = Math.max(pointerHighlight, influence);
            }
            points[idx] = nextX;
            points[idx + 1] = nextY;
          } else if (type === TYPE_FRAME) {
            const basePx = baseX[i];
            const basePy = baseY[i];
            const tension = 1 + Math.sin(t * 0.35 + phase) * 0.045;
            const pullX = centerX + (basePx - centerX) * tension;
            const pullY = centerY + (basePy - centerY) * tension;
            points[idx] = Math.min(Math.max(pullX, 0), width);
            points[idx + 1] = Math.min(Math.max(pullY, 0), height);
          } else if (type === TYPE_DRIFT) {
            velocities[idx] += Math.sin(t * 1.12 + phase) * 0.0018 * speedScales[i];
            velocities[idx + 1] += Math.cos(t * 1.04 + phase) * 0.0018 * speedScales[i];
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

            velocities[idx] = Math.max(Math.min(velocities[idx], 0.28), -0.28);
            velocities[idx + 1] = Math.max(Math.min(velocities[idx + 1], 0.28), -0.28);
          }
        }

        if (!lastUpdate || time - lastUpdate > 120) {
          pushDiagram();
          lastUpdate = time;
        }

        // Update pointer energy and related CSS variables
        const currentEnergy = pointerEnergyRef.current;
        const targetEnergy = pointerActive ? Math.max(pointerHighlight, currentEnergy * 0.82) : currentEnergy * 0.9;
        const clampedEnergy = Math.min(1, targetEnergy);
        pointerEnergyRef.current = clampedEnergy;
        const boardElement = boardRef.current;
        if (boardElement) {
          boardElement.style.setProperty("--cursor-energy", clampedEnergy.toFixed(3));
          boardElement.style.setProperty("--mesh-alpha", (0.32 + clampedEnergy * 0.38).toFixed(3));
        }

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }


    // Handle board resizing
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      seedPoints();
      pushDiagram();
    });
    resizeObserver.observe(board);

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      board.removeEventListener("pointermove", handlePointerMove);
      board.removeEventListener("pointerdown", handlePointerMove);
      board.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [prefersStatic]);

  // Render the interactive portal with SVG and category nodes
  return (
    <section className="portal">
      <div ref={boardRef} className="portal-board">
        {diagram ? ( // Only render SVG if diagram is ready
          <svg className="portal-svg" viewBox={`0 0 ${diagram.width} ${diagram.height}`} preserveAspectRatio="none">
            <path className="portal-mesh" d={diagram.meshPath} />
            {diagram.cells.map((cell, index) => (
              <g
                style={{ "--node-index": index } as NodeStyle} // Custom property for styling
                key={cell.href} // Use href as key for stability
                tabIndex={0} // Make focusable
                role="link" // Accessibility role
                className="portal-node" // Category node group
                aria-label={`${cell.title}`} // Accessibility label
                onClick={() => router.push(cell.href)} // Navigate on click
                onKeyDown={(event) => { // Handle keyboard navigation
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(cell.href);
                  }
                }}
              > {/* Category shape and label */}
                <path className="portal-node__shape" d={cell.path} /> 
                <text className="portal-node__title" x={cell.label.x} y={cell.label.y - 6}> 
                  {cell.title}
                </text>
              </g>
            ))}
          </svg>
        ) : null}
      </div>
      {/* Portal content */}
      <div className="portal-content">
        <h1 className={`portal-title ${italiana.className}`}>luke white</h1>
      </div>
    </section>
  );
}

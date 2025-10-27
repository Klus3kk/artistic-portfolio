"use client";

import { Italiana } from "next/font/google";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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
  { href: "/photos", title: "Photos" },
] as const;

// --- Utility ---
const createRng = (seed: number) => {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

function polygonCentroid(points: [number, number][]): [number, number] {
  let area = 0, x = 0, y = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p1 = points[i], p2 = points[j];
    const f = p1[0] * p2[1] - p2[0] * p1[1];
    area += f;
    x += (p1[0] + p2[0]) * f;
    y += (p1[1] + p2[1]) * f;
  }
  area *= 0.5;
  return [x / (6 * area), y / (6 * area)];
}

export default function HomePage() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cells, setCells] = useState<
    { href: string; title: string; path: string; label: { x: number; y: number } }[]
  >([]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return;
    const ctx = canvas.getContext("2d")!;

    // --- Initialize geometry ---
    const rng = createRng(42);
    const resize = () => {
      const rect = board.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const width = board.clientWidth;
    const height = board.clientHeight;
    const totalPoints = 1200; // number of background nodes
    const points: [number, number][] = [];
    const velocities: [number, number][] = [];

    // place category anchors
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.32;
    for (let i = 0; i < portalCategories.length; i++) {
      const angle = (i / portalCategories.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push([x, y]);
      velocities.push([0, 0]);
    }

    // random drift points
    for (let i = portalCategories.length; i < totalPoints; i++) {
      points.push([Math.random() * width, Math.random() * height]);
      velocities.push([(rng() - 0.5) * 0.4, (rng() - 0.5) * 0.4]);
    }

    // --- precompute category polygons ---
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const categoryCells = portalCategories.map((c, i) => {
      const polygon = voronoi.cellPolygon(i) as [number, number][];
      const centroid = polygonCentroid(polygon);
      const path =
        polygon.map(([x, y], j) => `${j === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
        "Z";
      return { ...c, path, label: { x: centroid[0], y: centroid[1] } };
    });
    setCells(categoryCells);

    // --- animation ---
    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "rgba(73, 35, 21, 0.26)";

      // drift motion
      for (let i = portalCategories.length; i < totalPoints; i++) {
        let [x, y] = points[i];
        let [vx, vy] = velocities[i];
        x += vx;
        y += vy;
        if (x < 0 || x > width) vx *= -1;
        if (y < 0 || y > height) vy *= -1;
        velocities[i] = [vx, vy];
        points[i] = [x, y];
      }

      const flat = delaunay.points;
      for (let i = 0; i < points.length; i++) {
        flat[2 * i] = points[i][0];
        flat[2 * i + 1] = points[i][1];
      }

      const v = delaunay.voronoi([0, 0, width, height]);
      for (let i = 0; i < totalPoints; i++) {
        const poly = v.cellPolygon(i);
        if (!poly) continue;
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let j = 1; j < poly.length; j++) ctx.lineTo(poly[j][0], poly[j][1]);
        ctx.closePath();
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="portal">
      <div ref={boardRef} className="portal-board">
        {/* background mesh */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(140deg, #f5eed9 0%, #f8f0d3 55%, #f1e6c2 100%)",
          }}
        />
        {/* interactive labels */}
        <svg
          className="portal-svg"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {cells.map((cell, index) => (
            <g
              key={cell.href}
              style={{ "--node-index": index } as NodeStyle}
              className="portal-node"
              tabIndex={0}
              role="link"
              aria-label={cell.title}
              onClick={() => router.push(cell.href)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(cell.href);
                }
              }}
            >
              <path className="portal-node__shape" d={cell.path} />
              <text
                className="portal-node__title"
                x={cell.label.x}
                y={cell.label.y - 6}
                textAnchor="middle"
              >
                {cell.title}
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

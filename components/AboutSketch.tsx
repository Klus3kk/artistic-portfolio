"use client";

import { useEffect, useRef } from "react";

type AboutSketchProps = {
  hue: number;
};

declare global {
  interface Window {
    p5?: any;
  }
}

const P5_CDN = "https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js";
let p5Loader: Promise<any> | null = null;

const loadP5 = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (window.p5) {
    return Promise.resolve(window.p5);
  }
  if (p5Loader) {
    return p5Loader;
  }

  p5Loader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${P5_CDN}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.p5));
      existing.addEventListener("error", (error) => {
        p5Loader = null;
        reject(error);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = P5_CDN;
    script.async = true;
    script.onload = () => resolve(window.p5);
    script.onerror = (error) => {
      p5Loader = null;
      reject(error);
    };
    document.head.appendChild(script);
  });

  return p5Loader;
};

export function AboutSketch({ hue }: AboutSketchProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sketchRef = useRef<any>(null);
  const hueRef = useRef(hue);

  useEffect(() => {
    hueRef.current = hue;
    const sketch = sketchRef.current;
    if (sketch?.customSetHue) {
      sketch.customSetHue(hue);
    }
  }, [hue]);

  useEffect(() => {
    let mounted = true;

    const startSketch = async () => {
      if (typeof window === "undefined") return;

      try {
        const p5 = await loadP5();
        if (!mounted || !hostRef.current || !p5) return;

        const sketch = new p5((p: any) => {
          type Orbit = {
            radius: number;
            angle: number;
            speed: number;
            size: number;
            wobble: number;
          };

          let orbits: Orbit[] = [];
          let currentHue = hueRef.current;
          let targetHue = hueRef.current;

          const getBounds = () => {
            const element = hostRef.current;
            if (!element) {
              return { width: 360, height: 480 };
            }
            const rect = element.getBoundingClientRect();
            const minWidth = Math.max(320, rect.width || 0);
            const minHeight = Math.max(400, rect.height || 0);
            return { width: minWidth, height: minHeight };
          };

          const seedOrbits = () => {
            const { width, height } = getBounds();
            const maxRadius = Math.min(width, height) * 0.45;
            orbits = Array.from({ length: 28 }, (_, index) => ({
              radius: p.random(40, maxRadius),
              angle: p.random(p.TWO_PI),
              speed: p.random(0.004, 0.012) * (index % 2 === 0 ? 1 : -1),
              size: p.random(12, 28),
              wobble: p.random(0.4, 1.1)
            }));
          };

          const resizeCanvas = () => {
            const { width, height } = getBounds();
            p.resizeCanvas(width, height);
            seedOrbits();
          };

          (p as any).customSetHue = (value: number) => {
            targetHue = value;
          };

          p.setup = () => {
            const { width, height } = getBounds();
            p.createCanvas(width, height);
            p.pixelDensity(window.devicePixelRatio || 1);
            p.colorMode(p.HSB, 360, 100, 100, 100);
            p.noStroke();
            seedOrbits();
          };

          p.windowResized = resizeCanvas;

          p.draw = () => {
            currentHue = p.lerp(currentHue, targetHue, 0.05);
            p.clear();

            const baseRadius = Math.max(p.width, p.height) * 0.6;
            const ctx = p.drawingContext as CanvasRenderingContext2D;

            ctx.save();
            ctx.translate(p.width / 2, p.height / 2);
            const gradient = ctx.createRadialGradient(0, 0, baseRadius * 0.1, 0, 0, baseRadius);
            gradient.addColorStop(0, `hsla(${currentHue}, 68%, 72%, 0.8)`);
            gradient.addColorStop(1, `hsla(${currentHue}, 30%, 24%, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            p.push();
            p.translate(p.width / 2, p.height / 2);

            orbits.forEach((orbit, index) => {
              const angle = orbit.angle + p.frameCount * orbit.speed;
              const radius = orbit.radius + Math.sin((p.frameCount + index * 12) * 0.02) * 18 * orbit.wobble;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle * 0.92) * radius * 0.72;
              const alpha = 16 + index * 1.8;

              p.fill(currentHue, 45, 95, alpha);
              p.ellipse(x, y, orbit.size * 3.2, orbit.size * 3.8);

              p.fill(currentHue, 58, 78, alpha + 12);
              p.circle(x * 0.86, y * 0.92, orbit.size);
            });

            p.noFill();
            p.stroke(currentHue, 42, 46, 28);
            p.strokeWeight(1.4);
            p.beginShape();
            const rippleRadius = Math.min(p.width, p.height) * 0.45;
            for (let i = 0; i <= 220; i++) {
              const theta = (i / 220) * p.TWO_PI;
              const noiseSample = p.noise(
                Math.cos(theta) * 0.8 + p.frameCount * 0.01,
                Math.sin(theta) * 0.8 + p.frameCount * 0.01
              );
              const r = rippleRadius + noiseSample * 26;
              p.vertex(Math.cos(theta) * r, Math.sin(theta) * r * 0.94);
            }
            p.endShape(p.CLOSE);
            p.pop();
          };
        }, hostRef.current);

        sketchRef.current = sketch;
      } catch (error) {
        console.error("Failed to initialise p5 sketch", error);
      }
    };

    startSketch();

    return () => {
      mounted = false;
      if (sketchRef.current) {
        sketchRef.current.remove();
        sketchRef.current = null;
      }
    };
  }, []);

  return <div className="about-sketch" ref={hostRef} aria-hidden="true" />;
}

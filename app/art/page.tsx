"use client";

import { useEffect, useRef, useState } from "react";
import { artPieces } from "@/lib/content";

export default function ArtPage() {
  const [selectedArtIndex, setSelectedArtIndex] = useState(0);
  const panoramaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panoramaElement = panoramaRef.current;
    if (!panoramaElement) return;

    const layers = Array.from(panoramaElement.querySelectorAll<HTMLElement>("[data-depth]"));
    let pointerRatio = 0.5;
    let rafId = 0;

    const animate = () => {
      rafId = 0;
      const rect = panoramaElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const progress = Math.min(1, Math.max(0, 1 - (rect.top + rect.height) / (viewportHeight + rect.height)));

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth ?? "0");
        const offsetX = (pointerRatio - 0.5) * depth * 120;
        const offsetY = (0.5 - progress) * depth * 180;
        layer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      });
    };

    const requestAnimate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(animate);
    };

    requestAnimate();

    const handleScroll = () => requestAnimate();
    const handleResize = () => requestAnimate();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = panoramaElement.getBoundingClientRect();
      pointerRatio = (event.clientX - rect.left) / rect.width;
      pointerRatio = Math.min(1, Math.max(0, pointerRatio));
      requestAnimate();
    };

    const handlePointerLeave = () => {
      pointerRatio = 0.5;
      requestAnimate();
    };

    panoramaElement.addEventListener("pointermove", handlePointerMove);
    panoramaElement.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      panoramaElement.removeEventListener("pointermove", handlePointerMove);
      panoramaElement.removeEventListener("pointerleave", handlePointerLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const currentArt = artPieces[selectedArtIndex];

  return (
    <section className="section art-section">
      <div className="section-heading">
        <p className="eyebrow">Art</p>
        <h3>Panorama Hall — drift through layered canvases.</h3>
        <p>
          Scroll or drag to glide past a 2.5D corridor. Each frame reveals its story in the inspector. Built for smooth
          parallax using lightweight canvas effects and CSS transforms.
        </p>
      </div>
      <div className="art-experience">
        <div className="panorama" data-parallax ref={panoramaRef}>
          <div className="panorama-track" aria-hidden="true">
            <div className="panorama-layer layer-back" data-depth="0.12" />
            <div className="panorama-layer layer-mid" data-depth="0.25">
              {artPieces.map((piece, index) => (
                <button
                  key={piece.title}
                  type="button"
                  className={`frame${selectedArtIndex === index ? " is-active" : ""}`}
                  onClick={() => setSelectedArtIndex(index)}
                  aria-pressed={selectedArtIndex === index}
                >
                  <span className="frame-media" aria-hidden="true" />
                  <span className="frame-caption">
                    <strong>{piece.title}</strong>
                    <span>{piece.medium}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="panorama-layer layer-front" data-depth="0.45" />
          </div>
        </div>
        <aside className="art-inspector" aria-live="polite">
          <h4>Work details</h4>
          <dl>
            <div>
              <dt>Title</dt>
              <dd>{currentArt.title}</dd>
            </div>
            <div>
              <dt>Medium</dt>
              <dd>{currentArt.medium}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{currentArt.description}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}

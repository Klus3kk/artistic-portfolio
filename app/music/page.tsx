"use client";

import { useState } from "react";
import { albumList, musicDiscs, singleList } from "@/lib/content";

export default function MusicPage() {
  const [musicView, setMusicView] = useState<"stage" | "list">("stage");
  const [musicMessage, setMusicMessage] = useState("Select a disc or preview to queue a snippet.");

  const handleMusicViewChange = (view: "stage" | "list") => {
    setMusicView(view);
    setMusicMessage(
      view === "stage"
        ? "Immersive stage enabled—drag discs to explore. List view available for low-power devices."
        : "Compact list view loaded—preview tracks without the 3D scene."
    );
  };

  const handleMusicPreview = (label: string) => {
    setMusicMessage(`Preview queued: ${label}. (Audio previews load on demand.)`);
  };

  return (
    <section className="section music-section">
      <div className="section-heading">
        <p className="eyebrow">Music</p>
        <h3>Vinyl vault &amp; singles rack.</h3>
        <p>
          The immersive room leverages Three.js with GLTF assets and baked lighting (loading soon). Need a quick skim?
          Switch to list view for an energy-efficient overview. Click any preview to queue it up.
        </p>
      </div>
      <div className="music-toolbar" role="group" aria-label="Music view options">
        <button
          type="button"
          className={`pill-button${musicView === "stage" ? " is-active" : ""}`}
          onClick={() => handleMusicViewChange("stage")}
        >
          Immersive stage
        </button>
        <button
          type="button"
          className={`pill-button${musicView === "list" ? " is-active" : ""}`}
          onClick={() => handleMusicViewChange("list")}
        >
          Compact list
        </button>
      </div>
      <div className="music-experience" data-view={musicView}>
        {musicView === "stage" ? (
          <div className="music-stage" aria-label="Immersive 3D music room placeholder">
            <canvas id="music-canvas" width={640} height={360} aria-hidden="true" />
            <div className="stage-overlay">
              <p>Three.js scene loading placeholder — GLTF vinyl wall &amp; CD carousel will render here.</p>
              <p className="stage-hint">
                Drag to look around · tap discs to preview · hardware too warm? Switch to list view.
              </p>
            </div>
            <div className="stage-discs">
              {musicDiscs.map((disc) => (
                <button
                  key={disc.id}
                  type="button"
                  className={`disc ${disc.variant === "vinyl" ? "vinyl" : "cd"}`}
                  onClick={() => handleMusicPreview(disc.title)}
                >
                  <span className="disc-label">{disc.title}</span>
                  <span className="disc-sub">{disc.typeLabel}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="music-list">
            <div className="list-column">
              <h4>Albums (Vinyl)</h4>
              <ul>
                {albumList.map((album) => (
                  <li key={album.title}>
                    <span className="list-title">{album.title}</span>
                    <span className="list-meta">{album.meta}</span>
                    <button
                      type="button"
                      className="preview-button"
                      onClick={() => handleMusicPreview(album.title)}
                    >
                      Preview
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="list-column">
              <h4>Singles (CD)</h4>
              <ul>
                {singleList.map((single) => (
                  <li key={single.title}>
                    <span className="list-title">{single.title}</span>
                    <span className="list-meta">{single.meta}</span>
                    <button
                      type="button"
                      className="preview-button"
                      onClick={() => handleMusicPreview(single.title)}
                    >
                      Preview
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="music-feedback" aria-live="polite">
        {musicMessage}
      </div>
    </section>
  );
}

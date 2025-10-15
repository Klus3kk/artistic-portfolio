"use client";

import { useEffect, useRef, useState } from "react";
import { poemEntries } from "@/lib/content";

export default function PoemsPage() {
  const [poemReaderOpen, setPoemReaderOpen] = useState(false);
  const [activePoem, setActivePoem] = useState(poemEntries[0]);
  const poemCloseRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!poemReaderOpen) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePoemReader();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [poemReaderOpen]);

  useEffect(() => {
    if (!poemReaderOpen) return;
    const timer = window.setTimeout(() => {
      poemCloseRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [poemReaderOpen]);

  const openPoemReader = (title: string, excerpt: string, trigger: HTMLButtonElement | null) => {
    setActivePoem({ title, excerpt });
    lastTriggerRef.current = trigger;
    setPoemReaderOpen(true);
  };

  const closePoemReader = () => {
    setPoemReaderOpen(false);
    const trigger = lastTriggerRef.current;
    if (trigger) window.setTimeout(() => trigger.focus(), 0);
  };

  return (
    <section className="section poems-section">
      <div className="section-heading">
        <p className="eyebrow">Poems</p>
        <h3>Bookshelf stories with a calm reading view.</h3>
        <p>
          Choose a spine to open the text in high-contrast reading mode. Minimal motion, generous type, and keyboard
          controls let the words take center stage.
        </p>
      </div>
      <div className="poem-shelf">
        {poemEntries.map((poem) => (
          <article className="poem-card" key={poem.title}>
            <button
              type="button"
              className="poem-trigger"
              onClick={(event) => openPoemReader(poem.title, poem.excerpt, event.currentTarget)}
            >
              <span className="poem-spine">{poem.title}</span>
            </button>
          </article>
        ))}
      </div>
      <div
        className={`poem-reader${poemReaderOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!poemReaderOpen}
        aria-labelledby="poem-reader-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closePoemReader();
          }
        }}
      >
        <div className="poem-reader-panel">
          <button
            type="button"
            className="poem-reader-close"
            aria-label="Close reading mode"
            onClick={closePoemReader}
            ref={poemCloseRef}
          >
            Close
          </button>
          <h4 id="poem-reader-title">{activePoem.title}</h4>
          <p id="poem-reader-text">{activePoem.excerpt}</p>
        </div>
      </div>
    </section>
  );
}

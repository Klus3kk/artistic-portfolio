"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { retroWindows } from "@/lib/content";

type DesktopLayout = "stack" | "grid";

type DesktopWindowState = {
  id: string;
  top?: number;
  left?: number;
  zIndex: number;
  collapsed: boolean;
};

export default function GraphicsPage() {
  const [desktopLayout, setDesktopLayout] = useState<DesktopLayout>("stack");
  const [windowStates, setWindowStates] = useState<DesktopWindowState[]>(
    retroWindows.map((windowData, index) => ({
      id: windowData.id,
      zIndex: 10 + index,
      collapsed: false
    }))
  );

  const desktopRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const zIndexCounterRef = useRef(10 + retroWindows.length);

  const windowStateMap = useMemo(() => {
    const map: Record<string, DesktopWindowState> = {};
    windowStates.forEach((state) => {
      map[state.id] = state;
    });
    return map;
  }, [windowStates]);

  const bringWindowToFront = (id: string) => {
    zIndexCounterRef.current += 1;
    const nextZ = zIndexCounterRef.current;
    setWindowStates((prev) =>
      prev.map((state) => (state.id === id ? { ...state, zIndex: nextZ } : state))
    );
  };

  const handleWindowToggleCollapsed = (id: string) => {
    setWindowStates((prev) =>
      prev.map((state) =>
        state.id === id ? { ...state, collapsed: !state.collapsed } : state
      )
    );
  };

  const handleWindowPointerDown = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    const state = windowStateMap[id];
    if (desktopLayout === "grid" || state?.collapsed) return;
    if ((event.target as HTMLElement).closest("button")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    bringWindowToFront(id);

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    dragStateRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");
    event.preventDefault();
  };

  const handleWindowPointerMove = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== id || dragState.pointerId !== event.pointerId) return;
    const desktopElement = desktopRef.current;
    if (!desktopElement) return;

    const desktopRect = desktopElement.getBoundingClientRect();
    const element = event.currentTarget;

    const desiredLeft = event.clientX - desktopRect.left - dragState.offsetX;
    const desiredTop = event.clientY - desktopRect.top - dragState.offsetY;
    const clampedLeft = Math.max(0, Math.min(desiredLeft, desktopRect.width - element.offsetWidth));
    const clampedTop = Math.max(0, Math.min(desiredTop, desktopRect.height - element.offsetHeight));

    setWindowStates((prev) =>
      prev.map((state) =>
        state.id === id ? { ...state, left: clampedLeft, top: clampedTop } : state
      )
    );
  };

  const handleWindowPointerEnd = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.id !== id || dragState.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    const element = event.currentTarget;
    element.classList.remove("is-dragging");
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  };

  const handleDesktopLayoutChange = (layout: DesktopLayout) => {
    setDesktopLayout(layout);
    if (layout === "grid") {
      dragStateRef.current = null;
    }
  };

  return (
    <section className="section graphics-section">
      <div className="section-heading">
        <p className="eyebrow">Graphics</p>
        <h3>Retro desktop — draggable windows, keyboard friendly.</h3>
        <p>
          Inspired by classic OS skins. Drag, focus, or open everything as a grid for quick browsing. Each window has
          keyboard shortcuts and action buttons for accessibility.
        </p>
      </div>
      <div
        className="retro-desktop"
        data-layout={desktopLayout}
        ref={desktopRef}
      >
        <div className="desktop-toolbar" role="group" aria-label="Window controls">
          <button
            type="button"
            className={`pill-button${desktopLayout === "grid" ? " is-active" : ""}`}
            onClick={() => handleDesktopLayoutChange("grid")}
          >
            Open all as grid
          </button>
          <button
            type="button"
            className={`pill-button${desktopLayout === "stack" ? " is-active" : ""}`}
            onClick={() => handleDesktopLayoutChange("stack")}
          >
            Return to layered view
          </button>
        </div>
        {retroWindows.map((windowData) => {
          const state = windowStateMap[windowData.id];
          const style: CSSProperties = {
            "--initial-top": `${windowData.initialTopPercent}%`,
            "--initial-left": `${windowData.initialLeftPercent}%`,
            zIndex: state?.zIndex ?? 10
          };

          if (desktopLayout === "stack") {
            if (typeof state?.top === "number") {
              style["--window-top"] = `${state.top}px`;
            }
            if (typeof state?.left === "number") {
              style["--window-left"] = `${state.left}px`;
            }
          }

          return (
            <article
              key={windowData.id}
              className="retro-window"
              data-window-id={windowData.id}
              data-collapsed={state?.collapsed ? "true" : undefined}
              style={style}
              role="region"
              aria-labelledby={`${windowData.id}-title`}
              tabIndex={0}
              onFocus={() => bringWindowToFront(windowData.id)}
              onPointerDown={(event) => handleWindowPointerDown(event, windowData.id)}
              onPointerMove={(event) => handleWindowPointerMove(event, windowData.id)}
              onPointerUp={(event) => handleWindowPointerEnd(event, windowData.id)}
              onPointerCancel={(event) => handleWindowPointerEnd(event, windowData.id)}
            >
              <header>
                <div className="window-buttons">
                  <span />
                  <span />
                  <span />
                </div>
                <h4 id={`${windowData.id}-title`}>{windowData.title}</h4>
                <button
                  type="button"
                  className="window-close"
                  aria-label="Minimize window"
                  onClick={() => handleWindowToggleCollapsed(windowData.id)}
                >
                  {state?.collapsed ? "+" : "—"}
                </button>
              </header>
              <div className="window-body">
                <div className={`window-preview ${windowData.patternClass}`} aria-hidden="true" />
                <p>{windowData.description}</p>
              </div>
              <footer>
                <button type="button">Download</button>
                <button type="button">View case study</button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}

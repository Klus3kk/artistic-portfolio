"use client";

import { useEffect, useRef } from "react";
import { photoEntries } from "@/lib/content";

const PHOTO_GRADIENT = "linear-gradient(120deg, rgba(217, 171, 115, 0.25), rgba(9, 6, 12, 0.85))";

export default function PhotosPage() {
  const photoRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const frame = entry.target as HTMLElement;
          const index = Number(frame.dataset.index ?? "-1");
          if (index < 0 || index >= photoEntries.length) {
            observer.unobserve(frame);
            return;
          }

          const thumb = frame.querySelector<HTMLElement>(".photo-thumb");
          if (thumb) {
            const fullImage = new Image();
            fullImage.src = photoEntries[index].full;
            fullImage.addEventListener("load", () => {
              thumb.style.backgroundImage = `url("${photoEntries[index].full}"), ${PHOTO_GRADIENT}`;
            });
          }

          frame.classList.add("is-visible");
          observer.unobserve(frame);
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" }
    );

    photoEntries.forEach((photo, index) => {
      const frame = photoRefs.current[index];
      if (!frame) return;
      const thumb = frame.querySelector<HTMLElement>(".photo-thumb");
      if (thumb) {
        thumb.style.backgroundImage = `url("${photo.placeholder}"), ${PHOTO_GRADIENT}`;
      }
      observer.observe(frame);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="section photos-section">
      <div className="section-heading">
        <p className="eyebrow">Photos</p>
        <h3>Framed stills — low-to-hi reveal on scroll.</h3>
        <p>
          A masonry of frames that “snap” into place. Each uses a lightweight placeholder while the high-resolution
          version loads just in time.
        </p>
      </div>
      <div className="photo-wall">
        {photoEntries.map((photo, index) => (
          <figure
            key={photo.title}
            className="photo-frame"
            data-index={index}
            ref={(node) => {
              photoRefs.current[index] = node;
            }}
          >
            <div className="photo-thumb" aria-hidden="true" />
            <figcaption>{photo.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { achievements, timelineEntries } from "@/lib/content";

const aboutSections = [
  {
    id: "overall",
    label: "Overall",
    tagline: "Studio overview",
    headline:
      "An evolving practice weaving sound, visuals, and words into one storyline.",
    description:
      "Placeholder for your signature statement. Map how every discipline connects, what themes you return to, and the experience you want people to leave with.",
    threads: [
      "Describe the mission that ties music, imagery, and prose together.",
      "Highlight the communities or collaborators that orbit your work.",
      "Note what is currently lighting up the studio — residencies, research, or shows.",
    ],
    bio: "Future bio placeholder — trace how the studio formed, the cities it calls home, and the creative values that steer the multidisciplinary work.",
    approach:
      "Outline how every project starts with research, moves through prototyping across mediums, and lands as an immersive story experience.",
    approachNotes: [
      "Invite analog imperfection into every digital build.",
      "Design experiences that reward slow looking and deep listening.",
      "Prototype with collaborators early, then iterate in public.",
    ],
    stats: [
      {
        value: "05",
        caption: "multi-discipline showcases to feature the full studio range.",
      },
      {
        value: "12",
        caption:
          "immersive collaborations with museums, collectives, or indie games.",
      },
    ],
    timeline: [
      timelineEntries[0],
      {
        year: "2023",
        description:
          "Curated “Golden Hour Study” — cross-medium screening & gallery pairing.",
      },
      timelineEntries[2],
    ],
    links: [
      { label: "Instagram", href: "https://instagram.com/your-handle" },
      { label: "Portfolio Hub", href: "/" },
      { label: "Contact", href: "mailto:hello@yourstudio.com" },
    ],
  },
  {
    id: "music",
    label: "Music",
    tagline: "Cinematic audio",
    headline:
      "Composing immersive scores for twilight cities and imagined worlds.",
    description:
      "Swap in why your music matters: the textures you reach for, the emotions you chase, and where listeners can dive deeper.",
    threads: [
      "List active releases or live performances you want to spotlight.",
      "Describe how you build palettes — hardware, software, field recordings.",
      "Mention collaborators, guest vocalists, or commissions worth noting.",
    ],
    bio: "Add a short origin story: how the first tracks emerged, the genres you hybridize, and the types of scores you love crafting.",
    approach:
      "Detail how you sketch melodies, sample field recordings, sculpt synths, then master for immersive playback spaces.",
    approachNotes: [
      "Map each project to a color palette and tempo landscape.",
      "Prototype spatial mixes before final mastering.",
      "Blend modular synths with raw voice and acoustic textures.",
    ],
    stats: achievements.slice(0, 2),
    timeline: timelineEntries.slice(0, 2),
    links: [
      { label: "Spotify", href: "https://open.spotify.com/artist/your-handle" },
      { label: "Bandcamp", href: "https://bandcamp.com/your-handle" },
      { label: "Live Sets", href: "/music" },
    ],
  },
  {
    id: "art",
    label: "Art",
    tagline: "Visual studies",
    headline: "Layering analog tactility with speculative digital gestures.",
    description:
      "Speak about your visual experiments, what mediums you love, and the stories the pieces whisper when seen up close.",
    threads: [
      "Outline upcoming exhibitions, print drops, or installations.",
      "Call out the materials or processes that define your current body of work.",
      "Hint at any crossovers with music, writing, or interactive pieces.",
    ],
    bio: "Place a note about the mediums — oil, ink, projection — and the influences guiding your visual language right now.",
    approach:
      "Explain how you sketch by hand, digitize fragments, and fuse them with procedural textures to finish the pieces.",
    approachNotes: [
      "Start with tactile paper studies before any screen time.",
      "Prototype color passes in small multiples to test light.",
      "Photograph each layer for archival process reels.",
    ],
    stats: [
      {
        value: "08",
        caption:
          "gallery installations exploring light, shadow, and projection.",
      },
      { value: "24", caption: "mixed-media works in the current collection." },
    ],
    timeline: [
      {
        year: "2024",
        description:
          "Mounted “Spectrum City” in collaboration with local light designers.",
      },
      {
        year: "2021",
        description: "Released limited risograph run “Velvet Storm Studies.”",
      },
    ],
    links: [
      { label: "Art Portfolio", href: "/art" },
      { label: "Prints", href: "/art#prints" },
      { label: "Instagram", href: "https://instagram.com/your-handle" },
    ],
  },
  {
    id: "photos",
    label: "Photo",
    tagline: "Observational lens",
    headline: "Capturing stills that feel like neon poems and quiet diaries.",
    description:
      "Share what you hunt for through the lens — mood, color, serendipity — and where people can explore full series.",
    threads: [
      "Highlight ongoing photo stories or publications.",
      "Mention the gear, film stocks, or techniques shaping the aesthetic.",
      "Note how photography feeds into the rest of the practice.",
    ],
    bio: "Talk about the cameras you trust, the film stock you swear by, and the night walks that shape these frames.",
    approach:
      "Describe the rituals — twilight scouting, long exposures, layered reflections — that translate into each photo essay.",
    approachNotes: [
      "Shoot parallel film and digital to blend grit and clarity.",
      "Archive color palettes to inspire painting and motion work.",
      "Pair each series with short written vignettes.",
    ],
    stats: [
      {
        value: "18",
        caption: "urban night photosets published over the past three years.",
      },
      { value: "04", caption: "zines released with poetry + photo pairings." },
    ],
    timeline: [
      {
        year: "2024",
        description:
          "Premiered “Afterglow Atlas” photo essay at Micro Gallery.",
      },
      {
        year: "2022",
        description:
          "Documented “Signal Bloom” residency in daily photo dispatches.",
      },
    ],
    links: [
      { label: "Photo Archive", href: "/photos" },
      { label: "Latest Zine", href: "/photos#zine" },
      { label: "Medium Essays", href: "https://medium.com/@your-handle" },
    ],
  },
  {
    id: "poems",
    label: "Poetry",
    tagline: "Text fragments",
    headline:
      "Writing verses that storyboard emotion before anything is built.",
    description:
      "Placeholder for your literary voice — how poems, spoken word, or essays complement the visual and sonic work.",
    threads: [
      "Include where poems live: chapbooks, zines, performances.",
      "Explain the themes you explore and how they echo across other mediums.",
      "Cue upcoming readings, collaborations, or releases.",
    ],
    bio: "Outline how journaling, spoken word, or collaborative readings weave into the studio practice.",
    approach:
      "Share how you build poem cycles, experiment with cadence, and layer them with projections or sound baths.",
    approachNotes: [
      "Let poems start as voice memos before refining text.",
      "Pair each stanza with a supporting visual or sound cue.",
      "Release chapbooks alongside intimate listening sessions.",
    ],
    stats: [
      {
        value: "03",
        caption:
          "chapbooks in circulation blending text, photo, and augmented layers.",
      },
      {
        value: "11",
        caption: "live readings scored with ambient improvisation.",
      },
    ],
    timeline: [
      {
        year: "2023",
        description:
          "Released “Signal Bloom” interactive poetry zine with AR overlays.",
      },
      {
        year: "2021",
        description:
          "Hosted a poetry/sound salon series in partnership with Local Loft.",
      },
    ],
    links: [
      { label: "Poetry Library", href: "/poems" },
      { label: "Substack", href: "https://substack.com/@your-handle" },
      { label: "Spoken Sets", href: "/poems#performances" },
    ],
  },
  {
    id: "graphics",
    label: "Graphics",
    tagline: "Interface lab",
    headline:
      "Prototyping interfaces and typographic experiments for speculative futures.",
    description:
      "Describe the design systems, motion studies, or UI kits you craft — and how they support the broader artistic universe.",
    threads: [
      "Name recent client or self-initiated projects that exemplify the style.",
      "Reference tools, workflows, or accessibility principles you champion.",
      "Point to case studies, documentation, or sandbox builds.",
    ],
    bio: "Placeholder for the story behind your interface work — hybridizing retro OS nostalgia with modern accessibility.",
    approach:
      "Talk about how you wireframe on paper, animate in prototypes, and stress-test interactions for inclusivity.",
    approachNotes: [
      "Prototype in grayscale before adding color or texture.",
      "Document systems in living style guides for collaborators.",
      "Blend typography studies with motion cues for clarity.",
    ],
    stats: [
      {
        value: "18",
        caption: "design systems shipped for creative tech studios since 2020.",
      },
      {
        value: "06",
        caption: "experimental UI packs released for community use.",
      },
    ],
    timeline: [
      {
        year: "2024",
        description:
          "Launched “Interface Hack.02” toolkit exploring adaptive layouts.",
      },
      {
        year: "2022",
        description:
          "Collaborated on inclusive dashboard redesigns for cultural institutions.",
      },
    ],
    links: [
      { label: "Design Systems", href: "/graphics" },
      { label: "Figma Community", href: "https://figma.com/@your-handle" },
      { label: "Case Studies", href: "/graphics#cases" },
    ],
  },
] as const;

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState(aboutSections[0].id);
  const section =
    aboutSections.find((item) => item.id === activeSection) ?? aboutSections[0];

  // Right-column animations only
  const colStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
    exit: { transition: { staggerChildren: 0.06, staggerDirection: -1 } },
  };
  const cardFx = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.25, ease: "easeInOut" },
    },
  };

  // Prebuild the five cards (so we can place them into two tracks)
  const CardBio = (
    <motion.aside
      className="about-window about-window-bio"
      variants={cardFx}
      key="bio"
    >
      <h3>Bio</h3>
      <p>{section.bio}</p>
    </motion.aside>
  );

  const CardApproach = (
    <motion.aside
      className="about-window about-window-approach"
      variants={cardFx}
      key="approach"
    >
      <h3>Approach</h3>
      <p>{section.approach}</p>
      <ul>
        {section.approachNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </motion.aside>
  );

  const CardHighlights = (
    <motion.aside
      className="about-window about-window-stats"
      variants={cardFx}
      key="highlights"
    >
      <h3>Highlights</h3>
      <ul>
        {section.stats.map((item) => (
          <li key={item.caption}>
            <span>{item.value}</span>
            <p>{item.caption}</p>
          </li>
        ))}
      </ul>
    </motion.aside>
  );

  const CardTimeline = (
    <motion.aside
      className="about-window about-window-timeline"
      variants={cardFx}
      key="timeline"
    >
      <h3>Timeline</h3>
      <ul>
        {section.timeline.map((entry) => (
          <li key={entry.year}>
            <span>{entry.year}</span>
            <p>{entry.description}</p>
          </li>
        ))}
      </ul>
    </motion.aside>
  );

  const CardLinks = (
    <motion.aside
      className="about-window about-window-links"
      variants={cardFx}
      key="links"
    >
      <h3>Elsewhere</h3>
      <ul>
        {section.links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.aside>
  );

  // Balanced 2-track placement (no scrollbar, no clipping)
  // Left track: 3 cards; Right track: 2 cards — visually weighted and tidy.
  const leftTrack = [CardBio, CardHighlights, CardLinks];
  const rightTrack = [CardApproach, CardTimeline];

  return (
    <section className="about-single">
      <Link className="about-back" href=" / ">
        ← Back
      </Link>

      <div className="about-single-grid">
        {/* LEFT — unchanged */}
        <div className="about-column about-column-left">
          <div className="about-eyebrow">About</div>
          <h2>{section.headline}</h2>
          <p>{section.description}</p>
        </div>

        {/* CENTER — unchanged */}
        <div className="about-column about-column-center">
          <div className="about-portrait-panel">
            <div className="about-portrait-shell">
              <span className="about-portrait-label">{section.label}</span>
              <span className="about-portrait-tagline">{section.tagline}</span>
              <span className="about-portrait-placeholder">
                Add your portrait
              </span>
              <div className="about-portrait-text">
                <p>
                  Placeholder for your signature statement — the first-person
                  snapshot you want people to read while the portrait sits in
                  the spotlight.
                </p>
                <ul>
                  {section.threads.slice(0, 2).map((thread) => (
                    <li key={thread}>{thread}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <nav className="about-switcher" aria-label="Primary disciplines">
            {aboutSections.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={isActive ? "is-active" : ""}
                  aria-pressed={isActive}
                >
                  <span className="about-switcher-label">{item.label}</span>
                  <span className="about-switcher-tagline">{item.tagline}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT — adaptive two-column masonry layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={section.id + "-windows"}
            className="about-windows"
            variants={colStagger}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridAutoRows: "minmax(0, 1fr)",
              gridAutoFlow: "row dense",
              alignContent: "space-between",
              gap: "1.5rem",
              height: "calc(100vh - 8rem)",
              boxSizing: "border-box",
              padding: "1.5rem 1rem 1.5rem 1rem",
            }}
          >
            {[
              <motion.aside
                className="about-window"
                variants={cardFx}
                key="bio"
              >
                <h3>Bio</h3>
                <p>{section.bio}</p>
              </motion.aside>,

              <motion.aside
                className="about-window"
                variants={cardFx}
                key="approach"
              >
                <h3>Approach</h3>
                <p>{section.approach}</p>
                <ul>
                  {section.approachNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </motion.aside>,

              <motion.aside
                className="about-window"
                variants={cardFx}
                key="stats"
              >
                <h3>Highlights</h3>
                <ul>
                  {section.stats.map((item) => (
                    <li key={item.caption}>
                      <span>{item.value}</span>
                      <p>{item.caption}</p>
                    </li>
                  ))}
                </ul>
              </motion.aside>,

              <motion.aside
                className="about-window"
                variants={cardFx}
                key="timeline"
              >
                <h3>Timeline</h3>
                <ul>
                  {section.timeline.map((entry) => (
                    <li key={entry.year}>
                      <span>{entry.year}</span>
                      <p>{entry.description}</p>
                    </li>
                  ))}
                </ul>
              </motion.aside>,

              <motion.aside
                className="about-window"
                variants={cardFx}
                key="links"
              >
                <h3>Elsewhere</h3>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.aside>,
            ]}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

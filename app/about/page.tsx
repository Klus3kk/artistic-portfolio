import { achievements, principles, timelineEntries } from "@/lib/content";

export default function AboutPage() {
  return (
    <section className="section about-section">
      <div className="section-heading">
        <p className="eyebrow">About</p>
        <h3>Artist, technologist, storyteller.</h3>
        <p>
          I craft multisensory experiences that bridge intimate handmade detail with speculative digital futures. Here’s
          a glimpse at the journey so far and the principles that steer every project.
        </p>
      </div>
      <div className="about-grid">
        <aside className="about-portrait">
          <div className="portrait-frame">
            <span className="portrait-glow" aria-hidden="true" />
            <div className="portrait-placeholder" aria-hidden="true" />
            <p className="portrait-caption">Self portrait, synthwave lighting study</p>
          </div>
          <div className="principles">
            <h4>Principles</h4>
            <ul>
              {principles.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="about-details">
          <section className="timeline" aria-label="Career timeline">
            <h4>Timeline highlights</h4>
            <ol>
              {timelineEntries.map((entry) => (
                <li key={entry.year}>
                  <span className="year">{entry.year}</span>
                  <p>{entry.description}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="achievements" aria-label="Selected achievements">
            <h4>Selected achievements</h4>
            <ul>
              {achievements.map((item) => (
                <li key={item.value}>
                  <strong>{item.value}</strong>
                  {item.description}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}

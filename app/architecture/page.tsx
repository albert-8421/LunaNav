import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownToLine, Moon } from "lucide-react";

export const metadata: Metadata = {
  title: "Technical architecture | LUNA NAV",
  description: "Architecture diagram and technical workflow for the LUNA NAV lunar planning application.",
};

export default function ArchitecturePage() {
  return (
    <main className="architecture-page">
      <header className="architecture-header">
        <Link className="architecture-brand" href="/" aria-label="LUNA NAV home">
          <span className="architecture-brand-mark"><Moon size={18} /></span>
          <span><strong>LUNA NAV</strong><small>Lunar south pole explorer</small></span>
        </Link>
        <nav className="architecture-nav" aria-label="Project pages">
          <Link className="selected" href="/architecture" aria-current="page">Architecture</Link>
          <Link href="/#about">About</Link>
          <Link href="/user-manual">User manual</Link>
        </nav>
      </header>

      <div className="architecture-content">
        <div className="architecture-intro">
          <p className="architecture-kicker">HOW THE APP IS BUILT</p>
          <h1>From a place and time<br />to a view of the lunar sky</h1>
          <p>LUNA NAV is a single Next.js application. The browser gathers a plan, the server requests live positions when selected, and the page turns the returned samples into readable comparisons.</p>
        </div>

        <figure className="architecture-figure">
          <Image
            src="/luna-nav-architecture.svg"
            alt="Architecture diagram: user settings flow through the Next.js interface and ephemeris API route to NASA JPL Horizons. Ephemeris samples then feed client-side calculations and the sky, timeline, and comparison views. Sample mode and reference site data are local."
            width={1440}
            height={820}
            priority
            unoptimized
          />
          <figcaption>
            <span>System architecture and data flow</span>
            <a href="/luna-nav-architecture.svg" download><ArrowDownToLine size={14} /> Download SVG</a>
          </figcaption>
        </figure>

        <section className="architecture-workflow" aria-labelledby="workflow-title">
          <div className="architecture-section-heading">
            <span>WORKFLOW</span>
            <h2 id="workflow-title">What happens when you make a plan</h2>
          </div>
          <ol className="workflow-steps">
            <li><strong>Choose a place and time.</strong><span>The browser reads a reference location from the site JSON or accepts custom coordinates. It converts the selected local date and time to UTC.</span></li>
            <li><strong>Request live positions.</strong><span>In Live NASA data mode, the browser calls <code>/api/ephemeris</code>. The Next.js route validates the request and asks JPL Horizons for the Sun (10) and Earth (399), observed from the selected coordinates on the Moon (301).</span></li>
            <li><strong>Prepare and measure.</strong><span>The route pairs matching timestamps and returns the samples. TypeScript calculations estimate geometric visibility intervals, duration, and elevation statistics. The route caches successful results briefly.</span></li>
            <li><strong>Compare the views.</strong><span>The browser updates the SVG sky diagram, Recharts timeline, visibility bars, and three scenario cards. Three.js powers the interactive lunar explorer. Sample preview uses clearly labelled illustrative data locally and does not replace a failed live request.</span></li>
          </ol>
        </section>

        <section className="architecture-details" aria-label="Implementation details and limits">
          <article>
            <h2>Live position request</h2>
            <p>The server uses the Moon as the observing centre, with the selected lunar coordinates, and requests apparent, airless directions. The response includes azimuth, elevation, range, and angular diameter when available.</p>
          </article>
          <article>
            <h2>What is not modeled</h2>
            <p>The app does not currently process LOLA terrain elevations or calculate terrain obstruction, electrical power, landing safety, or a radio link budget. Its visibility measures use sampled geometric horizons.</p>
          </article>
        </section>

        <footer className="architecture-footer">
          <span>Built by Team Renaura · NASA Space Apps Challenge 2026</span>
          <Link href="/">Return to the planner ↑</Link>
        </footer>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, Moon } from "lucide-react";

export const metadata: Metadata = {
  title: "User manual | LUNA NAV",
  description: "A plain-language guide to exploring lunar places, dates, sunlight and Earth visibility in LUNA NAV.",
};

export default function UserManualPage() {
  return (
    <main className="manual-page">
      <header className="manual-header">
        <Link className="manual-brand" href="/" aria-label="LUNA NAV home">
          <span className="manual-brand-mark"><Moon size={18} /></span>
          <span><strong>LUNA NAV</strong><small>Lunar south pole explorer</small></span>
        </Link>
        <nav className="manual-actions" aria-label="Project pages and manual downloads">
          <Link href="/architecture">Architecture</Link>
          <Link href="/#about">About</Link>
          <Link href="/user-manual" className="selected" aria-current="page">User manual</Link>
          <a href="/LUNA_NAV_User_Manual.pdf" download className="manual-download"><ArrowDownToLine size={15} /> PDF</a>
        </nav>
      </header>

      <div className="manual-content">
        <div className="manual-intro">
          <p className="manual-kicker">HELP &amp; QUICK REFERENCE</p>
          <h1>User manual</h1>
          <p className="manual-lede">Use LUNA NAV to compare estimated sunlight and Earth visibility at places near the Moon&apos;s south pole.</p>
          <p className="manual-note">This is an exploration tool. Its results are not a landing approval, power estimate, or communications link assessment.</p>
        </div>

        <nav className="manual-contents" aria-label="On this page">
          <a href="#start">Getting started</a>
          <a href="#sky">Sky view</a>
          <a href="#timeline">Timeline and comparison</a>
          <a href="#explorer">Moon explorer</a>
          <a href="#data">Data and limits</a>
          <a href="#team">About the team</a>
        </nav>

        <article className="manual-article">
          <section id="start" className="manual-section">
            <h2>1. Start a session</h2>
            <ol className="manual-steps">
              <li><strong>Choose a place.</strong> Pick one of the listed lunar features or choose <em>Enter my own coordinates</em>. Listed points are reference locations, not approved landing zones.</li>
              <li><strong>Set a date and time.</strong> The date control uses your device&apos;s local time. Results are displayed in UTC.</li>
              <li><strong>Set the time window.</strong> Choose from 24 hours up to 14 days. The time step controls how often the sky is sampled.</li>
              <li><strong>Choose the data source.</strong> <em>Sample preview</em> uses illustrative values. <em>Live NASA data</em> requests Sun and Earth positions from JPL Horizons and needs an internet connection.</li>
              <li><strong>Read the results.</strong> The sky view shows the selected moment. The summary and chart cover the full time window.</li>
            </ol>
          </section>

          <section id="sky" className="manual-section">
            <h2>2. Read the sky view</h2>
            <p>The circular view shows the sky around your selected location on the Moon.</p>
            <div className="manual-table-wrap">
              <table className="manual-table">
                <thead><tr><th scope="col">Part of the view</th><th scope="col">What it means</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Centre</th><td>Directly overhead, at the zenith.</td></tr>
                  <tr><th scope="row">Outer edge</th><td>The horizon. Elevation 0° is on the horizon; a negative elevation is below it.</td></tr>
                  <tr><th scope="row">Direction</th><td>Azimuth starts at north (0°) and increases clockwise.</td></tr>
                  <tr><th scope="row">Faint marker</th><td>The Sun or Earth is below the geometric horizon at the selected time.</td></tr>
                </tbody>
              </table>
            </div>
            <h3>What the numbers mean</h3>
            <ul className="manual-bullets">
              <li><strong>Sun above horizon:</strong> estimated time when the Sun&apos;s centre is geometrically above 0°.</li>
              <li><strong>Highest Sun elevation:</strong> the Sun&apos;s maximum elevation during the selected window.</li>
              <li><strong>Earth line of sight:</strong> estimated time when Earth&apos;s centre is above the horizon. This is not a verified radio connection.</li>
              <li><strong>Show more measurements:</strong> includes average Sun elevation and an estimate of when any part of Earth&apos;s disk may be visible, if its apparent size is available.</li>
            </ul>
          </section>

          <section id="timeline" className="manual-section">
            <h2>3. Use the timeline and compare plans</h2>
            <p>The chart plots Sun and Earth elevation in degrees over time. The 0° line marks the geometric horizon. Lines above it are above the horizon; lines below it are not.</p>
            <ul className="manual-bullets">
              <li><strong>Play:</strong> moves the selected-time marker through the window. Pause to inspect a moment.</li>
              <li><strong>Time slider:</strong> drag it to a sample. The sky view updates to match.</li>
              <li><strong>Visibility bars:</strong> colored segments show sampled periods above the geometric horizon. Duration estimates interpolate between samples.</li>
            </ul>
            <p>Each of the three plans has its own place, start date, and time window. Compare sunlight duration, highest Sun elevation, Earth visibility duration, and highest Earth elevation. LUNA NAV does not combine them into a score or rank locations; compare the individual estimates that matter to you.</p>
          </section>

          <section id="explorer" className="manual-section">
            <h2>4. Explore the Moon</h2>
            <p>In the optional Moon explorer, drag to rotate and scroll to zoom. Select a reference marker or use the place list to change locations.</p>
            <ul className="manual-bullets">
              <li>The globe is schematic, not a photographic map.</li>
              <li>The illustrated surface relief is generic and does not show measured terrain at your selected location.</li>
              <li>The 3D sky shows Sun and Earth directions. Marker sizes and distances are not to scale; use the 2D view and chart for the displayed angles.</li>
            </ul>
          </section>

          <section id="data" className="manual-section">
            <h2>5. Data and limits</h2>
            <p>Live NASA data uses the JPL Horizons API to request apparent Sun and Earth directions from the selected location on the Moon. Network access or Horizons availability can affect live requests. If a request fails, check your connection and choose <em>Try again</em>. Sample values are never substituted automatically; choose <em>Sample preview</em> yourself to explore the interface.</p>
            <p>Sample preview values are illustrative, not an ephemeris prediction. Reference coordinates represent lunar feature locations listed in NASA&apos;s <a href="https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf" target="_blank" rel="noreferrer">Lunar Surface Data Book, Revision A</a>.</p>
            <ul className="manual-bullets">
              <li>The app does not currently use LOLA elevation rasters or calculate local terrain obstruction, slope, shadows, or landing safety.</li>
              <li>Sunlight duration is not an electrical power estimate.</li>
              <li>Earth visibility is not a communications link budget and does not account for terrain or radio equipment.</li>
            </ul>
            <p className="manual-note">Use LUNA NAV to explore and compare geometry. Do not use it as a certified landing-site assessment.</p>
            <p className="manual-sources">Source: <a href="https://ssd-api.jpl.nasa.gov/doc/horizons.html" target="_blank" rel="noreferrer">JPL Horizons API documentation</a></p>
          </section>

          <section id="team" className="manual-section manual-team-section">
            <h2>About the team</h2>
            <p>LUNA NAV was built for the NASA Space Apps Challenge 2026, Lunar Landing Site Navigator challenge.</p>
            <dl className="manual-team-details">
              <div><dt>Team</dt><dd>Renaura</dd></div>
              <div><dt>Members</dt><dd>Albert Joseph, Antos Reju, and Abid TS</dd></div>
              <div><dt>Local event</dt><dd>Kanjirappally</dd></div>
              <div><dt>College</dt><dd>Computer Science students at Amal Jyothi College of Engineering, Kanjirappally, Kerala, India</dd></div>
              <div><dt>Contact</dt><dd><a href="mailto:albertjoseph8421@gmail.com">Albert Joseph · albertjoseph8421@gmail.com</a></dd></div>
            </dl>
          </section>
        </article>

        <footer className="manual-footer"><span>LUNA NAV · Team Renaura · NASA Space Apps Challenge 2026</span><Link href="/">Return to the planner ↑</Link></footer>
      </div>
    </main>
  );
}

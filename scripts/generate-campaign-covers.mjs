/**
 * Writes one cover image per campaign into `public/campaigns`.
 *
 * Promotions and events need artwork the way a product needs a logo — a card
 * grid with ten blank banners reads as broken rather than as unillustrated. The
 * firm's real covers come from marketing; these stand in for them.
 *
 * **Generated, not downloaded.** `generate-underlying-logos.mjs` pulls seeded
 * photographs from Lorem Picsum, which is right for a company logo: the point
 * there is that each ticker gets a distinct, arbitrary image. A campaign cover
 * is a designed surface, and an arbitrary photograph behind "FCN Autocall
 * คูปอง 8.5%" looks like a stock-photo accident. These are drawn instead —
 * a brand-palette gradient, a soft highlight and a geometric motif, in the same
 * flat-SVG currency as `public/insights/*.svg`. Two things follow: the script
 * needs no network, and the output is byte-identical on every run.
 *
 * The files are committed. This is a one-off authoring tool, not a build step —
 * re-run it only after adding a campaign to `src/data/campaigns.json`:
 *
 *     npm run covers
 */

import fs from "node:fs";
import path from "node:path";

const SRC = "src/data/campaigns.json";
const OUT = "public/campaigns";
/** 16:9 — the aspect the card and detail banners both crop to. */
const WIDTH = 960;
const HEIGHT = 540;

/**
 * Palette per campaign, chosen by hand rather than hashed from the id.
 *
 * A hash would be stable but meaningless: the FCN promotion and the FCN dinner
 * would land on unrelated colours while two mutual-fund campaigns collided.
 * Keyed by desk instead, so the grid reads as a palette rather than confetti.
 */
const PALETTE = {
  "evt-global-outlook": { from: "#0a3d91", to: "#0ea5e9", motif: "grid" },
  "evt-fund-webinar": { from: "#1e1b4b", to: "#7c3aed", motif: "waves" },
  "evt-elite-dinner": { from: "#1c1917", to: "#92400e", motif: "arcs" },
  "evt-tax-planning": { from: "#134e4a", to: "#0891b2", motif: "grid" },
  "evt-wealth-clinic": { from: "#3730a3", to: "#2563eb", motif: "arcs" },
};

const DEFAULT_PALETTE = { from: "#0f172a", to: "#0a6ee7", motif: "grid" };

/** Concentric quarter-arcs sweeping out of the lower-right corner. */
function arcs() {
  return Array.from({ length: 6 }, (_, i) => {
    const r = 180 + i * 95;
    return `<circle cx="${WIDTH}" cy="${HEIGHT}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${(0.16 - i * 0.02).toFixed(3)}" stroke-width="2"/>`;
  }).join("");
}

/** A rising column chart, flush to the bottom edge. */
function bars() {
  const heights = [120, 190, 150, 250, 210, 320, 280, 390];
  return heights
    .map((h, i) => {
      const w = 64;
      const x = WIDTH - (heights.length - i) * (w + 26);
      return `<rect x="${x}" y="${HEIGHT - h}" width="${w}" height="${h}" rx="8" fill="#ffffff" fill-opacity="${(0.07 + i * 0.012).toFixed(3)}"/>`;
    })
    .join("");
}

/** Stacked sine-ish ribbons across the lower half. */
function waves() {
  return Array.from({ length: 4 }, (_, i) => {
    const y = 300 + i * 54;
    const d = `M0 ${y} C 240 ${y - 80}, 480 ${y + 80}, 720 ${y - 40} S 960 ${y - 90}, ${WIDTH} ${y - 60}`;
    return `<path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="${(0.18 - i * 0.035).toFixed(3)}" stroke-width="3" stroke-linecap="round"/>`;
  }).join("");
}

/** A faint dot lattice over the whole field. */
function grid() {
  const dots = [];
  for (let x = 60; x < WIDTH; x += 60) {
    for (let y = 60; y < HEIGHT; y += 60) {
      // Fades toward the lower-left, so the title area at top-left stays clean.
      const opacity = 0.05 + (x / WIDTH) * 0.14;
      dots.push(
        `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" fill-opacity="${opacity.toFixed(3)}"/>`,
      );
    }
  }
  return dots.join("");
}

const MOTIF = { arcs, bars, waves, grid };

function cover(id) {
  const { from, to, motif } = PALETTE[id] ?? DEFAULT_PALETTE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${from}"/>
<stop offset="1" stop-color="${to}"/>
</linearGradient>
<radialGradient id="h" cx="0.22" cy="0.18" r="0.75">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
${MOTIF[motif]()}
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#h)"/>
</svg>
`;
}

const campaigns = JSON.parse(fs.readFileSync(SRC, "utf8"));
if (campaigns.length === 0) {
  throw new Error(`No campaigns in ${SRC} — has the fixture shape changed?`);
}

fs.mkdirSync(OUT, { recursive: true });

let written = 0;
for (const campaign of campaigns) {
  // A `.webp` cover is real artwork pulled from Yuanta's CMS by
  // `fetch-campaign-covers.mjs`. Drawing over it would replace the banner the
  // client has already seen on the public site with a gradient.
  if (!campaign.cover.endsWith(".svg")) continue;

  // The fixture names the file it expects; writing anywhere else would leave a
  // broken banner that only shows up three screens away.
  const expected = campaign.cover;
  if (!expected.startsWith(`/${OUT.replace("public/", "")}/`)) {
    throw new Error(`${campaign.id}: cover "${expected}" is not under /campaigns`);
  }
  if (!PALETTE[campaign.id]) {
    console.warn(`${campaign.id}: no palette entry — using the default`);
  }
  fs.writeFileSync(path.join("public", expected), cover(campaign.id));
  written += 1;
}

console.log(`${written} covers → ${OUT}`);

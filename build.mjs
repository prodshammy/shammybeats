#!/usr/bin/env node
/**
 * PROD. SHAMMY beat store static site generator.
 * Zero npm dependencies. Reads beats.json + mixing.json → writes dist/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function normalizeBeat(raw) {
  const id = String(raw.id || "").trim();
  const title = String(raw.title || raw.name || "").trim();
  const price = Number(
    raw.price != null ? raw.price : raw.exclusivePrice != null ? raw.exclusivePrice : 100
  );
  return {
    id,
    title,
    bpm: raw.bpm ?? "",
    key: raw.key ?? "",
    mood: raw.mood ? String(raw.mood) : "",
    sampled: !!raw.sampled,
    price,
    exclusivePrice: price,
    cover: raw.cover || "",
    audio: raw.audio || "",
    stripePaymentLink: raw.stripePaymentLink || "",
    youtubeUrl: raw.youtubeUrl || "",
    hidden: !!raw.hidden,
  };
}

function visibleBeats(store) {
  return (store.beats || [])
    .map(normalizeBeat)
    .filter((b) => b.id && b.title && !b.hidden);
}

function downloadName(beat) {
  return `${beat.title} — Prod. Shammy (Free Lease).mp3`;
}

function buyHref(beat) {
  return beat.stripePaymentLink || "#";
}

function sampleBadge(beat) {
  return beat.sampled
    ? `\n          <span class="badge badge-sample">Sampled</span>`
    : "";
}

function moodMeta(beat) {
  return beat.mood
    ? `\n          <span>${esc(beat.mood)}</span>`
    : "";
}

function sampleNote(beat) {
  return beat.sampled
    ? `\n          <p class="sample-note">Contains a sample. Artist must clear the sample.</p>`
    : "";
}

function youtubeRow(beat, prefix) {
  if (!beat.youtubeUrl) return "";
  return `
          <div class="btn-row">
            <a class="btn btn-page" href="${esc(beat.youtubeUrl)}" rel="noopener noreferrer" target="_blank" title="Watch on YouTube">YouTube</a>
          </div>`;
}

function renderBeatCard(beat) {
  const href = `beats/${esc(beat.id)}/`;
  return `    <article class="beat-card" id="${esc(beat.id)}">
      <div class="cover-wrap">
        <a href="${href}"><img src="${esc(beat.cover)}" alt="${esc(beat.title)} cover art" loading="lazy" width="960" height="540"></a>
      </div>
      <div class="card-body">
        <h2 class="beat-title rgb-fringe"><a href="${href}" style="color:inherit;text-decoration:none">${esc(beat.title)}</a></h2>
        <div class="beat-meta">
          <span>${esc(beat.bpm)} BPM</span>
          <span>${esc(beat.key)}</span>${moodMeta(beat)}${sampleBadge(beat)}
        </div>
        <audio class="player" controls controlsList="nodownload noplaybackrate" oncontextmenu="return false" preload="none" src="${esc(beat.audio)}"></audio>
        <div class="actions">
          <div class="btn-row">
            <a class="btn btn-lease" href="${esc(beat.audio)}" download="${esc(downloadName(beat))}">Free Lease</a>
            <a class="btn btn-buy" href="${esc(buyHref(beat))}">Buy Exclusive · $${esc(beat.price)}</a>
          </div>
          <div class="btn-row">
            <button type="button" class="btn btn-copy" data-copy-link="${href}" title="Copy shareable link">Copy link</button>
            <a class="btn btn-page" href="${href}" title="Open beat page">Page</a>
          </div>${youtubeRow(beat)}
          <p class="lease-note">Free non-exclusive lease, unlimited use, credit Prod. Shammy</p>${sampleNote(beat)}
        </div>
      </div>
    </article>`;
}

function renderPricingCards(pricing, { bookLabel = true } = {}) {
  return pricing
    .map((p) => {
      const label = bookLabel
        ? p.id === "mix-master"
          ? `Book Both · $${p.price}`
          : `Book ${p.name} · $${p.price}`
        : `Buy · $${p.price}`;
      return `        <div class="price-card">
          <h3 class="rgb-fringe">${esc(p.name)}</h3>
          <p class="price-amount">$${esc(p.price)}</p>
          <p>${esc(p.summary)}</p>
          <a class="btn btn-buy" href="${esc(p.stripePaymentLink || "#")}">${esc(label)}</a>
        </div>`;
    })
    .join("\n");
}

function renderMixingSection(mixing) {
  const email = mixing.contactEmail || "shammypeters199@gmail.com";
  const mailto = `mailto:${email}?subject=Mixing%20stems%20%E2%80%94%20Prod.%20Shammy`;
  return `    <section class="mixing-section" id="mixing" aria-label="Mixing and mastering">
      <h2 class="rgb-fringe">Mixing &amp; Mastering</h2>
      <p class="mixing-lede">Human ears. Dark polish. Book a mix, a master, or both — then send stems.</p>
      <div class="pricing-grid">
${renderPricingCards(mixing.pricing || [])}
      </div>
      <p class="agreement-note">
        A mixing &amp; mastering service agreement applies.
        <span class="terms-placeholder" title="Contract page not created yet — placeholder path /mixing/terms">Service agreement provided before work begins</span>
        <!-- PLACEHOLDER_AGREEMENT_LINK: /mixing/terms (page not created yet) -->
      </p>
      <div class="stems-note" id="stems">
        <strong>How to send stems:</strong>
        After booking, email labeled stems (WAV preferred) to
        <a href="${esc(mailto)}">${esc(email)}</a>.
        Include song title, BPM/key if known, and any reference tracks.
      </div>
      <h3 class="portfolio-heading rgb-fringe">Portfolio</h3>
      <div class="portfolio-grid" data-mixing-portfolio></div>
      <div class="mixing-cta-row">
        <a class="btn btn-page" href="mixing/" title="Open mixing page">Full mixing page</a>
        <button type="button" class="btn btn-copy" data-copy-link="mixing/" title="Copy shareable link">Copy mixing link</button>
      </div>
    </section>`;
}

function renderLicenses(store) {
  const free = store.licenses?.freeLease;
  const ex = store.licenses?.exclusive;
  return `    <section class="licenses" id="licenses">
      <h2 class="rgb-fringe">Licenses</h2>
      <div class="license-grid">
        <div class="license-card">
          <h3>${esc(free?.name || "Free Lease (Non-Exclusive)")}</h3>
          <p>${esc(free?.summary || "")}</p>
        </div>
        <div class="license-card">
          <h3>${esc(ex?.name || "Exclusive Rights")}</h3>
          <p>${esc(ex?.summary || "")}</p>
          <p style="margin-top:0.6rem;color:var(--text-muted);font-size:0.78rem;">
            Exclusive pricing: $${esc(ex?.priceDefault ?? 100)} standard · $${esc(ex?.priceSampled ?? 50)} if the beat contains a sample (artist must clear the sample).
          </p>
        </div>
      </div>
    </section>`;
}

function renderIndex(store, mixing, beats) {
  const cards = beats.map(renderBeatCard).join("\n\n");
  const credit = store.artistCredit || { label: "Art: @Nobleheart", url: "https://x.com/Nobleheart" };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(store.brand || "PROD. SHAMMY")} — Beat Store</title>
  <meta name="description" content="Dark, human-made instrumentals from Prod. Shammy (Gray). Free lease or buy exclusive rights.">
  <meta name="theme-color" content="#0a0506">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(store.brand || "PROD. SHAMMY")} — Beat Store">
  <meta property="og:description" content="Dark, human-made instrumentals. Free lease or exclusive.">
  <meta property="og:image" content="assets/covers/seraph.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(store.brand || "PROD. SHAMMY")} — Beat Store">
  <meta name="twitter:image" content="assets/covers/seraph.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <header class="site-header wrap">
    <h1 class="brand rgb-fringe">${esc(store.brand || "PROD. SHAMMY")}</h1>
    <p class="tagline">Instrumentals · Free lease · Exclusive available</p>
    <nav class="nav-links" aria-label="Sections">
      <a href="#beats">Beats</a>
      <a href="#mixing">Mixing</a>
      <a href="#licenses">Licenses</a>
    </nav>
  </header>

  <main class="wrap">
    <p class="intro">Moody, VHS-soaked beats for artists who want something human. Preview in-page, grab a free lease, or lock exclusive rights.</p>

    <section id="beats" class="beats-grid" aria-label="Beat catalog">
      
${cards}
    </section>

${renderMixingSection(mixing)}

${renderLicenses(store)}
  </main>

  <footer class="site-footer wrap">
    <p><a href="${esc(credit.url)}" rel="noopener noreferrer" target="_blank">${esc(credit.label)}</a></p>
    <p class="human">${esc(store.tagline || "Beats + art: human made")}</p>
    <p style="margin-top:0.75rem;opacity:0.7">&copy; Prod. Shammy</p>
  </footer>

  <script src="assets/js/main.js"></script>
  <script src="assets/js/mixing.js"></script>
</body>
</html>
`;
}

function renderBeatPage(store, beat) {
  const credit = store.artistCredit || { label: "Art: @Nobleheart", url: "https://x.com/Nobleheart" };
  const free = store.licenses?.freeLease;
  const ex = store.licenses?.exclusive;
  const desc = `${beat.title} — ${beat.bpm} BPM ${beat.key} · Prod. Shammy. Free lease or buy exclusive ($${beat.price}).`;
  const sampleMeta = beat.sampled
    ? `\n        <span class="badge badge-sample">Sampled</span>`
    : "";
  const moodSpan = beat.mood ? `\n        <span>${esc(beat.mood)}</span>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(beat.title)} ${esc(beat.bpm)} ${esc(beat.key)} — ${esc(store.brand || "PROD. SHAMMY")}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="theme-color" content="#0a0506">
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${esc(beat.title)} ${esc(beat.bpm)} ${esc(beat.key)} — ${esc(store.brand || "PROD. SHAMMY")}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="../../${esc(beat.cover)}">
  <meta property="og:url" content="../${esc(beat.id)}/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(beat.title)} ${esc(beat.bpm)} ${esc(beat.key)} — ${esc(store.brand || "PROD. SHAMMY")}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="../../${esc(beat.cover)}">
  <link rel="canonical" href="./">
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>
  <header class="site-header wrap">
    <p style="margin-bottom:0.75rem"><a class="back-link" href="../../">&larr; All beats</a></p>
    <p class="brand rgb-fringe" style="font-size:clamp(1.4rem,4vw,2rem)"><a href="../../" style="color:inherit;text-decoration:none">${esc(store.brand || "PROD. SHAMMY")}</a></p>
  </header>

  <main class="wrap">
    <article class="beat-detail" id="${esc(beat.id)}">
      <div class="cover-wrap">
        <img src="../../${esc(beat.cover)}" alt="${esc(beat.title)} cover art" width="960" height="540">
      </div>
      <h1 class="beat-title rgb-fringe">${esc(beat.title)}</h1>
      <div class="beat-meta">
        <span>${esc(beat.bpm)} BPM</span>
        <span>${esc(beat.key)}</span>${moodSpan}${sampleMeta}
        <span class="price-tag">Exclusive $${esc(beat.price)}</span>
      </div>
      <audio class="player" controls controlsList="nodownload noplaybackrate" oncontextmenu="return false" preload="metadata" src="../../${esc(beat.audio)}"></audio>
      <div class="actions">
        <div class="btn-row">
          <a class="btn btn-lease" href="../../${esc(beat.audio)}" download="${esc(downloadName(beat))}">Free Lease</a>
          <a class="btn btn-buy" href="${esc(buyHref(beat))}">Buy Exclusive · $${esc(beat.price)}</a>
        </div>
        <div class="btn-row">
          <button type="button" class="btn btn-copy" data-copy-link="./" title="Copy shareable link">Copy link</button>
          <a class="btn btn-page" href="../../#${esc(beat.id)}">View on store</a>
        </div>${youtubeRow(beat)}
        <p class="lease-note">Free non-exclusive lease, unlimited use, credit Prod. Shammy</p>${sampleNote(beat)}
      </div>
    </article>

    <section class="licenses" id="licenses">
      <h2 class="rgb-fringe">Licenses</h2>
      <div class="license-grid">
        <div class="license-card">
          <h3>${esc(free?.name || "Free Lease (Non-Exclusive)")}</h3>
          <p>${esc(free?.summary || "")}</p>
        </div>
        <div class="license-card">
          <h3>${esc(ex?.name || "Exclusive Rights")}</h3>
          <p>${esc(ex?.summary || "")}</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer wrap">
    <p><a href="${esc(credit.url)}" rel="noopener noreferrer" target="_blank">${esc(credit.label)}</a></p>
    <p class="human">${esc(store.tagline || "Beats + art: human made")}</p>
  </footer>

  <script src="../../assets/js/main.js"></script>
</body>
</html>
`;
}

function renderMixingPage(store, mixing) {
  const email = mixing.contactEmail || "shammypeters199@gmail.com";
  const mailto = `mailto:${email}?subject=Mixing%20stems%20%E2%80%94%20Prod.%20Shammy`;
  const credit = store.artistCredit || { label: "Art: @Nobleheart", url: "https://x.com/Nobleheart" };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mixing &amp; Mastering — ${esc(store.brand || "PROD. SHAMMY")}</title>
  <meta name="description" content="Mixing & mastering by Prod. Shammy. Mix $60 · Master $60 · Mix + Master $110. Send stems to book.">
  <meta name="theme-color" content="#0a0506">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Mixing & Mastering — ${esc(store.brand || "PROD. SHAMMY")}">
  <meta property="og:description" content="Human ears. Dark polish. Mix $60 · Master $60 · Mix + Master $110.">
  <meta property="og:image" content="../assets/covers/seraph.jpg">
  <meta property="og:url" content="./">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Mixing & Mastering — ${esc(store.brand || "PROD. SHAMMY")}">
  <meta name="twitter:description" content="Mix $60 · Master $60 · Mix + Master $110. Portfolio + booking.">
  <meta name="twitter:image" content="../assets/covers/seraph.jpg">
  <link rel="canonical" href="./">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
  <header class="site-header wrap">
    <p style="margin-bottom:0.75rem"><a class="back-link" href="../">&larr; Beat store</a></p>
    <h1 class="brand rgb-fringe" style="font-size:clamp(1.8rem,6vw,3.2rem)">MIXING &amp; MASTERING</h1>
    <p class="tagline">Prod. Shammy · Human ears · Dark polish</p>
    <nav class="nav-links" aria-label="Sections">
      <a href="#pricing">Pricing</a>
      <a href="#portfolio">Portfolio</a>
      <a href="#stems">Send stems</a>
      <a href="../#beats">Beats</a>
    </nav>
  </header>

  <main class="wrap">
    <p class="intro">Need a mix, a master, or both? Book below, then send stems. A mixing &amp; mastering service agreement applies — provided before work begins.</p>

    <section class="mixing-section" id="pricing" aria-label="Mixing and mastering pricing">
      <h2 class="rgb-fringe">Pricing</h2>
      <p class="mixing-lede">Flat rates. No upsell theater.</p>
      <div class="pricing-grid">
${renderPricingCards(mixing.pricing || [])}
      </div>
      <p class="agreement-note">
        A mixing &amp; mastering service agreement applies.
        <span class="terms-placeholder" title="Contract page not created yet — placeholder path /mixing/terms">Service agreement provided before work begins</span>
        <!-- PLACEHOLDER_AGREEMENT_LINK: /mixing/terms (page not created yet) -->
      </p>

      <div class="stems-note" id="stems">
        <strong>How to send stems:</strong>
        After booking, email labeled stems (WAV preferred, one track per file, dry/wet as noted) to
        <a href="${esc(mailto)}">${esc(email)}</a>.
        Include song title, BPM/key if known, and any reference tracks.
      </div>

      <h2 class="portfolio-heading rgb-fringe" id="portfolio">Portfolio</h2>
      <div class="portfolio-grid" data-mixing-portfolio></div>
    </section>
  </main>

  <footer class="site-footer wrap">
    <p><a href="${esc(credit.url)}" rel="noopener noreferrer" target="_blank">${esc(credit.label)}</a></p>
    <p class="human">${esc(store.tagline || "Beats + art: human made")}</p>
    <p style="margin-top:0.75rem;opacity:0.7">&copy; Prod. Shammy</p>
  </footer>

  <script src="../assets/js/main.js"></script>
  <script src="../assets/js/mixing.js"></script>
</body>
</html>
`;
}

function writeConfigJs(store, beats) {
  const out = {
    ...store,
    beats: beats.map((b) => ({
      id: b.id,
      title: b.title,
      bpm: b.bpm,
      key: b.key,
      mood: b.mood || undefined,
      sampled: b.sampled,
      exclusivePrice: b.price,
      price: b.price,
      cover: b.cover,
      audio: b.audio,
      stripePaymentLink: b.stripePaymentLink,
      youtubeUrl: b.youtubeUrl || undefined,
      hidden: b.hidden || undefined,
    })),
  };
  // strip undefined
  out.beats = out.beats.map((b) => {
    const c = { ...b };
    Object.keys(c).forEach((k) => c[k] === undefined && delete c[k]);
    return c;
  });
  return `window.BEAT_STORE = ${JSON.stringify(out, null, 2)};\n`;
}

function main() {
  const store = readJson("beats.json");
  const mixing = readJson("mixing.json");
  const beats = visibleBeats(store);

  rmrf(DIST);
  ensureDir(DIST);

  // Static assets
  copyDir(path.join(ROOT, "assets"), path.join(DIST, "assets"));
  // Data files (runtime portfolio + CMS source mirrors)
  fs.copyFileSync(path.join(ROOT, "mixing.json"), path.join(DIST, "mixing.json"));
  fs.copyFileSync(path.join(ROOT, "beats.json"), path.join(DIST, "beats.json"));
  fs.copyFileSync(path.join(ROOT, "mixing.json"), path.join(DIST, "assets/js/mixing.json"));

  // Admin (Decap)
  copyDir(path.join(ROOT, "admin"), path.join(DIST, "admin"));

  // Generated pages
  fs.writeFileSync(path.join(DIST, "index.html"), renderIndex(store, mixing, beats));
  fs.writeFileSync(path.join(DIST, "assets/js/config.js"), writeConfigJs(store, beats));

  for (const beat of beats) {
    const dir = path.join(DIST, "beats", beat.id);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, "index.html"), renderBeatPage(store, beat));
  }

  ensureDir(path.join(DIST, "mixing"));
  fs.writeFileSync(path.join(DIST, "mixing/index.html"), renderMixingPage(store, mixing));

  console.log(`Built ${beats.length} beats → ${DIST}`);
}

main();

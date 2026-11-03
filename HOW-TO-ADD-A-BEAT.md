# How to add a beat (plain English)

You edit the site at **https://shammybeats.netlify.app/admin/** (after Netlify + GitHub are connected). You do **not** need to hand-edit HTML.

## First-time setup (once)

1. Push this repo to **github.com/prodshammy/shammybeats** (branch `main`).
2. Connect the repo to Netlify (site domain **shammybeats.netlify.app**). Build command is already in `netlify.toml`: `node build.mjs`, publish folder `dist`.
3. In Netlify, enable the **GitHub** OAuth provider for Decap/CMS (Netlify OAuth proxy: `base_url` `https://api.netlify.com`, site domain `shammybeats.netlify.app`). Open `/admin/` and log in with GitHub.
4. Alternate: Netlify **Identity** + **Git Gateway** (then switch `admin/config.yml` backend to `git-gateway`).

## Flip Sampled (price + Stripe link)

Gray / editors: the **Sampled** toggle fully drives pricing on the live site.

1. Open **https://shammybeats.netlify.app/admin/**
2. **Beats** → **Beat catalog** → pick the beat
3. Flip **Sampled** on or off
4. Confirm both **Stripe link $100** (`link100`) and **Stripe link $50** (`link50`) are filled
5. **Publish / Save** — Netlify rebuilds in about **1–2 minutes**

After rebuild:

- **Sampled ON** → **$50**, note *Contains a sample. Artist must clear the sample.*, buy button uses **link50**
- **Sampled OFF** → **$100**, buy button uses **link100**

## Add a new beat

1. In Stripe, create **one product** for the beat with **two prices** ($100 and $50), then a **Payment Link** for each. Copy both `buy.stripe.com` URLs.
2. Open **/admin/** → **Beats** → **Beat catalog**.
3. Add a list item under **Beats**:
   - **Name** — e.g. `HALO`
   - **ID / slug** — lowercase URL id, e.g. `halo` (page becomes `/beats/halo/`)
   - **BPM**, **Key**, optional **Mood**
   - **Sampled** — on if it contains a sample ($50); off for $100
   - **Audio** — upload the MP3
   - **Cover** — upload cover art
   - **Stripe link $100** and **Stripe link $50** — paste both URLs
   - **YouTube URL** — optional
   - **Hidden** — leave off so it shows on the site
4. Hit **Publish / Save**. Netlify rebuilds; wait a minute and refresh the live site.

## Mixing portfolio

Under **Mixing & Mastering**, edit pricing Stripe links if needed, and add portfolio rows (title, artist, before/after audio, cover) when you have real before/afters. Don’t invent fake tracks.

## If something looks wrong

- Empty Buy button → missing `link100` / `link50` (or legacy `stripePaymentLink`) for the current Sampled state.
- Beat missing from the store → check **Hidden**, or that **id** is filled in.
- Price wrong after flipping Sampled → wait for Netlify rebuild (~1–2 min); confirm both links are set.
- Local rebuild: from this folder run `node build.mjs` and open `dist/`.


## Audio hosting (off Netlify)

Store MP3s are served from the free public repo **prodshammy/shammybeats-audio** via GitHub raw (`AUDIO_BASE` in `build.mjs`; jsDelivr rejected the ~850MB audio repo over its 50MB package limit). Netlify does **not** publish `assets/audio/*.mp3`.

### After you upload a new beat in /admin

1. Save/publish the beat in Decap as usual (audio still lands in `assets/audio/` on GitHub via the CMS).
2. Copy the new MP3 into **prodshammy/shammybeats-audio** as `audio/<beat-id>.mp3` (same id/slug as the beat) and push `main`.
3. Raw GitHub URLs update within ~1–5 minutes of the push (CDN cache max-age ~300s).
4. Confirm the live beat page `<audio>` src points at the raw GitHub URL and playback/seek work.

Keep local `assets/audio/` files in the main repo for backups and Decap uploads; they are just not deployed to Netlify.

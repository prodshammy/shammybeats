# How to add a beat (plain English)

You edit the site at **https://shammybeats.netlify.app/admin/** (after Netlify + GitHub are connected). You do **not** need to hand-edit HTML.

## First-time setup (once)

1. Push this repo to **github.com/prodshammy/shammybeats** (branch `main`).
2. Connect the repo to Netlify (site domain **shammybeats.netlify.app**). Build command is already in `netlify.toml`: `node build.mjs`, publish folder `dist`.
3. In Netlify: turn on **Identity**, enable **Git Gateway**, and invite yourself. Open `/admin/` and log in with that invite.
4. (Optional) Netlify Identity → External providers can use GitHub. OAuth goes through Netlify (`https://api.netlify.com`).

## Add a new beat

1. Create a **Stripe Payment Link** for the exclusive price ($100, or $50 if sampled). Copy the `buy.stripe.com` URL. The editor will **not** create Stripe links for you.
2. Open **/admin/** → **Beats** → **Beat catalog**.
3. Add a list item under **Beats**:
   - **Name** — e.g. `HALO`
   - **ID / slug** — lowercase URL id, e.g. `halo` (page becomes `/beats/halo/`)
   - **BPM**, **Key**, optional **Mood**
   - **Sampled** — on if it contains a sample (price is usually $50)
   - **Audio** — upload the MP3
   - **Cover** — upload cover art
   - **Exclusive price** — number only (100 or 50)
   - **Stripe payment link** — paste the full URL from step 1
   - **YouTube URL** — optional
   - **Hidden** — leave off so it shows on the site
4. Hit **Publish / Save**. Netlify rebuilds; wait a minute and refresh the live site.

## Mixing portfolio

Under **Mixing & Mastering**, edit pricing Stripe links if needed, and add portfolio rows (title, artist, before/after audio, cover) when you have real before/afters. Don’t invent fake tracks.

## If something looks wrong

- Empty Buy button → missing Stripe payment link on that beat.
- Beat missing from the store → check **Hidden**, or that **id** is filled in.
- Local rebuild: from this folder run `node build.mjs` and open `dist/`.

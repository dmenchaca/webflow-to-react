# Pre-migration checklist

Complete this audit **before** writing any code. It takes ~20 minutes and saves hours later.

## Inventory the export

- [ ] Open `index.html` and list every top-level `<section>` (or equivalent wrapper). Each becomes a section component under `web/src/components/...` and is composed from the home route (`web/src/routes/index.tsx` or equivalent).
- [ ] Compare **live** Webflow (or published site) to the ZIP: elements hidden in Designer may be missing `w-hidden` / `hide` in the export — flag for manual class parity.
- [ ] Note any sections you will drop (`display: none` in export only) — skip unless the user wants them.
- [ ] List all HTML pages present (`index.html`, `style-guide.html`, `401.html`, `404.html`, CMS templates). Confirm which are in scope.

## Fonts

- [ ] List every file in `fonts/` with its filename and what format (`.woff2`, `.woff`, `.ttf`).
- [ ] Grep the compiled CSS for `font-family:` and list every unique family string (including quirky ones like `"Inter 18 Pt"`, `Plusjakartasans`).
- [ ] For each family, note which weights/styles the CSS references.
- [ ] Flag weights referenced by CSS that don't have a corresponding file — these need single-file-multi-weight registration or fallback.

## JavaScript

- [ ] Confirm which JS files are present under `js/`. Expect: `jquery*.js`, `webflow.js`. These are getting **dropped**.
- [ ] Check for GSAP: `gsap*.js`, `ScrollTrigger*.js`, `SplitText*.js` in `js/`, or inline `<script>` blocks that call `gsap.*`. GSAP is **kept** — ported to `useEffect` + `gsap.context()`.
- [ ] List GSAP timelines (each section's custom code). These become per-section `useEffect` hooks in the ported React code.
- [ ] Grep `index.html` for `<script>` tags. List third-party embeds (calendly, chat widgets, video embeds). These usually survive.
- [ ] Identify analytics: GTM, GA, Hotjar, Meta Pixel, Plausible, Fathom, or none. Confirm keep/replace/remove with user — **no default vendor**.
- [ ] Check for Webflow Interactions 2.0 (`data-w-id`, inline `<script>` with declarative JSON). These are **not** GSAP — confirm with user which are essential, drop the rest.

## CSS

- [ ] Run `wc -l css/*.css` to gauge size. Note the main site-specific file (usually 3–6k lines).
- [ ] Check for CSS custom properties / CSS variables (Webflow exports `:root { --black: ...; --purple: ... }`). These map to Tailwind theme tokens later.
- [ ] Note the media query breakpoints in use. Webflow defaults are 479 / 767 / 991 px.

## Assets

- [ ] Count files in `images/` (`ls images/ | wc -l`). Large counts (200+) should be audited for unused assets later.
- [ ] Check for videos, Rive/Lottie files, or SVG sprites. These need hooks or wrappers.

## Meta / SEO

- [ ] Capture `<title>`, `<meta name="description">`, and all `og:*` / `twitter:*` tags — wire them into TanStack Start’s head API / root layout (see starter docs; avoid leaving `generator` as `Webflow`).
- [ ] Note favicon and webclip filenames.
- [ ] Note any JSON-LD or structured data.
- [ ] If the **published** Webflow site (or export) has **`/sitemap.xml`** or **`/robots.txt`**, plan to recreate them: copy or rewrite into **`web/public/`** (static) or use TanStack [prerender sitemap / server routes](https://tanstack.com/start/v0/docs/framework/react/guide/seo) for dynamic lists — see [gotchas.md](../gotchas.md) § *Static sitemap.xml and robots.txt*.

## Integrations to confirm with user

- [ ] Analytics: which vendor or none?
- [ ] Deploy target (Netlify / Vercel / self-hosted)?
- [ ] Production domain / analytics IDs (per chosen tool)?
- [ ] Will there be a CMS later? (Affects whether to build pages as hard-coded arrays or CMS-backed.)
- [ ] Multi-page marketing beyond home? TanStack Router file routes cover this — confirm scope (blog, legal, locales).

## Red flags — stop and ask before migrating

- [ ] Webflow CMS collections actively in use on the site (not just defined).
- [ ] Webflow Memberships / authentication (not migratable as-is).
- [ ] E-commerce (Webflow Ecommerce) — needs a totally different approach.
- [ ] Complex Webflow Interactions 2.0 that are core to the brand experience — budget extra time or descope.
- [ ] Hundreds of CMS items — may need a content pipeline, not inline arrays.

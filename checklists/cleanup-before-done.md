# Cleanup checklist — ship gate

Do **not** declare the migration done until every item passes.

## Build & lint

- [ ] `npm run build` at the repo root completes successfully (proxies into `web/`).
- [ ] **`npm ci` in `web/`** succeeds from a clean tree (`rm -rf web/node_modules && cd web && npm ci`) whenever **`web/package.json`** or **`web/package-lock.json`** changed — Netlify uses **`npm ci`** when the lockfile exists; skipping this causes **`EUSAGE`** / **`ETARGET`** surprises on deploy. See [gotchas.md](../gotchas.md) § *npm ci, lockfiles, and `"latest"`*, [shipping.md](../shipping.md) § *Lockfile and CI parity*.
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run dev` and production preview: page matches the original Webflow site (visual spot-check).
- [ ] **`.hide` / hidden chrome:** if the export uses **`hide`** (or **`w-hidden`**) on nodes that must stay invisible, verify **Computed → `display: none`** after build — reversed **`marketing.css`** order (embed before site bundle) shows them by mistake ([gotchas.md](../gotchas.md) § *Designer-hidden nodes: `.hide` and stylesheet order*).

## TanStack Start / output path

- [ ] Local `(cd web && npm run build)` produces the **publish directory** referenced in **repo-root** `netlify.toml` (typically **`[build] base = "web"`** + **`publish = "dist/client"`** — **verify** with `ls web/dist` after build).
- [ ] **Netlify → Build settings: all overrides cleared (mission critical).** **Runtime, Base directory, Package directory, Build command, Publish directory,** and **Functions directory** must be **empty / Not set** — especially **not** `netlify/functions` and **not** Base = `/` or `web`. Only **repo-root `netlify.toml`** should define the build. Re-open settings after save. See [gotchas.md](../gotchas.md) § *Mission critical: Netlify UI*.
- [ ] `@netlify/vite-plugin-tanstack-start` is installed in `web/` and wired in `vite.config.ts` if deploying to Netlify.
- [ ] **`web/netlify.toml`** exists (from [templates/web-netlify.toml](../templates/web-netlify.toml)) so local **`vite dev`** works with the Netlify Vite plugin (`repositoryRoot` = `web/`).
- [ ] **SSR smoke test passes** before pushing — `vite build` is not a runtime check:
  ```bash
  cd web && npm run build && \
    node -e "import('./.netlify/v1/functions/server.mjs').then(() => console.log('SSR import OK')).catch(e => { console.error(e); process.exit(1) })"
  ```
  If it fails with `Cannot use import statement outside a module` or `ERR_REQUIRE_ESM`, add the package named in the stack to **`ssr.noExternal`** in `web/vite.config.ts` (see [gotchas.md](../gotchas.md) § SSR / [templates/vite-ssr-noexternal.example.ts](../templates/vite-ssr-noexternal.example.ts)) and rerun.
- [ ] **After deploy, open the live URL** and confirm the SSR function renders the page (Netlify “build success” does not exercise the function).

## Post-deploy HTML verification

- [ ] Fetch production HTML once — SSR can fail silently with a client fallback while the deploy stays green:
  ```bash
  curl -sS 'https://YOUR_SITE.netlify.app/' | tr -d '\0' | grep -E '<title>|Switched to client rendering|data-msg='
  ```
  Expect a real **`<title>…</title>`** and **no** `Switched to client rendering`. If you see the fallback, fix the function error (often `ssr.noExternal` — [gotchas.md](../gotchas.md) § SSR) and redeploy.

## Optional Core Web Vitals (if optimizing Lighthouse)

- [ ] **Font preloads** in root `head()` only for **above-the-fold** `woff2` files listed in `site-fonts.css` — see [gotchas.md](../gotchas.md) § Core Web Vitals.
- [ ] **Analytics (if any):** third-party scripts **not** blocking in `<head>` where possible; for Plausible specifically, optional [templates/PlausibleLoader.tsx](../templates/PlausibleLoader.tsx); **per-site** vendor and env.
- [ ] **CLS:** optional `performance-overrides.css` (last import) only with **per-export** selectors — [templates/performance-overrides.example.css](../templates/performance-overrides.example.css).
- [ ] **LCP images** in hero: **`loading="eager"`** / **`fetchPriority="high"`** where appropriate for **that** export.

## Bundle hygiene

- [ ] No `webflow.js` runtime, no `jquery*.js` in the client bundle:
  ```bash
  grep -rli "jquery\|webflow\.js" web/dist/ 2>/dev/null || echo "clean"
  ```
- [ ] GSAP bundles only where needed; GSAP init runs **client-only** (e.g. `useEffect`), not during SSR.
- [ ] No references to root-level export assets in build output:
  ```bash
  grep -rli "\.\./images\|\.\./fonts" web/dist/ 2>/dev/null || echo "clean"
  ```

## Asset URLs

- [ ] Every CSS `url(...)` is root-relative: `/images/...`, `/fonts/...`. No `./`, no `../`.
- [ ] Every font file referenced in `site-fonts.css` exists in `web/public/fonts/`.
- [ ] Every image referenced in the copied Webflow CSS exists in `web/public/images/` with the same filename.

## Fonts loading

- [ ] Open the dev site, DevTools → Network → filter by Font. Every `@font-face` `src` loads with status 200 (not 404).
- [ ] DevTools → Computed → `font-family` on body shows the brand family, not fallback Arial/serif.
- [ ] **macOS / WebKit:** DevTools → Computed on body text includes **`-webkit-font-smoothing: antialiased`** (and typically `-moz-osx-font-smoothing: grayscale`) — match the export’s `webflow.css` / `index.html`; missing this makes Inter and similar faces look **bolder/darker** than production.
- [ ] Bold and extrabold headings both resolve to the real font files (not synthesized bold).

## HTML shell / meta

- [ ] Root HTML shell (TanStack Start entry / route head) has the right `<title>` and description — values from **[templates/site-seo.example.ts](../templates/site-seo.example.ts)** / `web/src/site/seo.ts`.
- [ ] **`head()` includes `{ title: siteSeo.title }` inside the `meta` array** (not a top-level `title` key — that produces **no** `<title>` in SSR HTML). See [gotchas.md](../gotchas.md) § *The export’s `<head>`*.
- [ ] `<meta name="generator">` is **not** `Webflow` — use something accurate (`TanStack Start`, `Vite + React`, etc.).
- [ ] Root `<html>` has **no** `data-wf-page` / `data-wf-site` unless something in **`web/src/styles`** genuinely depends on them (verify with `rg 'data-wf-' web/src/styles` — empty output → safe to omit).
- [ ] OG/Twitter image URLs: prefer **production origin** or **`/images/...` on the live site**, not stale **`uploads-ssl.webflow.com`** links, unless you explicitly keep Webflow CDN assets.
- [ ] OG/Twitter meta tags match the original site.
- [ ] Agreed analytics behavior matches the export + user (removed, replaced, or kept per brief); **no extra** GTM/GA/Hotjar unless requested.
- [ ] Favicon + webclip resolve.
- [ ] If the site should expose **`/sitemap.xml`** and **`/robots.txt`**, they exist under **`web/public/`** (served as static files — see [gotchas.md](../gotchas.md) § *Static sitemap.xml and robots.txt*). `Sitemap:` and `<loc>` entries use the **live** production origin (HTTPS), not a stale Webflow preview URL.

## Webflow interactivity audit

Required when the page body came from **`html-react-parser` / raw HTML** or any path that **drops `webflow.js`** while keeping **`w-*`** classes and **`data-w-id`**. See [gotchas.md](../gotchas.md) § *Raw `html-react-parser`*, § *Webflow `webflow.js` behaviors*.

- [ ] **Navbar scroll states:** if the export has a **fixed** bar (e.g. `.hidden-nav` + `translate(0,-100%)`) and a **second** `w-nav` in the hero (`#hero-nav` / `is-no-bottom-border`), top-of-page vs scrolled visuals match Webflow (white bar slides in; hero overlay hides).
- [ ] **Mobile `w-nav`:** hamburger toggles menu (`w--open`, `data-nav-menu-open`); in-page `#` links close the menu.
- [ ] **`w-dropdown`:** opens/closes like the export (hover vs click per `data-hover`).
- [ ] **Scan the export** for `w-tabs`, `w-slider`, `w-lightbox`, `w-form`, **`fs-*`** — each works, was reimplemented, or was removed on purpose.
- [ ] **IX2 `<style>` pre-states** in the export `<head>` (`html.w-mod-js:not(.w-mod-ix) [data-w-id="…"]`) — initial layout matches production after removing IX2 (adjust CSS or add compensating JS).

## Sections coverage

- [ ] Every top-level Webflow section from the original `index.html` is implemented or explicitly dropped with a comment.
- [ ] Navbar links match the original.
- [ ] Footer links + legal copy match the original.

## Animations (GSAP)

- [ ] Every `useEffect` that calls GSAP returns `() => ctx.revert()`.
- [ ] `gsap.registerPlugin(...)` is called once at module scope, not inside components.
- [ ] `gsap.context(fn, scopeRef)` is used to scope selectors.
- [ ] No GSAP runs during SSR (no `window` / DOM access at module top level in shared server code).
- [ ] ScrollTrigger re-measures after layout shifts where needed.
- [ ] No element has both a GSAP tween AND a CSS `@keyframes` animation targeting it.

## Interactive widgets

- [ ] Floating widgets appear/disappear based on the right section's visibility.
- [ ] Tooltips work and dismiss on outside click.
- [ ] FAQ accordion / tabs behave as on the original site.
- [ ] Testimonial iframe resizes correctly if used.

## Responsive

- [ ] 320, 479, 768, 992, 1200, 1440 px widths: no unintended horizontal scroll.
- [ ] Nav behaves correctly on mobile.

## Cross-browser

- [ ] Chrome + Safari + Firefox desktop.
- [ ] iOS Safari when possible.

## Repo hygiene

- [ ] Root `package.json` has only proxy scripts, no heavy deps (unless monorepo tooling).
- [ ] `.cursor/rules/` contains scaffolded rule files from this skill.
- [ ] Root `README.md` points to `web/` and mentions TanStack Start.
- [ ] Repo-root `netlify.toml`: **`publish`** (relative to **`[build] base`**) matches **actual** `web/dist/*` output after build — not `web/dist/...` duplicated under `base`.

## First-run deploy (when shipping)

- [ ] **[shipping.md](../shipping.md) completed:** private GitHub repo exists, `main` pushed, Netlify site linked — **or** user explicitly skipped deploy.
- [ ] No secrets (Netlify tokens, `.env` with keys) committed.

## Pre-handoff

- [ ] Clean dev server restart works (`npm run dev` → page renders).
- [ ] Git: no `node_modules/`, `dist/`, or `.DS_Store` committed.

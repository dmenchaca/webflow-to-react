# Cleanup checklist — ship gate

Do **not** declare the migration done until every item passes.

## Build & lint

- [ ] `npm run build` at the repo root completes successfully (proxies into `web/`).
- [ ] `npm run lint` passes with no errors.
- [ ] `npm run dev` and production preview: page matches the original Webflow site (visual spot-check).

## TanStack Start / output path

- [ ] Local `(cd web && npm run build)` produces the **publish directory** referenced in **repo-root** `netlify.toml` (typically **`[build] base = "web"`** + **`publish = "dist/client"`** — **verify** with `ls web/dist` after build). Prefer **empty** Netlify UI build fields so the file is authoritative.
- [ ] `@netlify/vite-plugin-tanstack-start` is installed in `web/` and wired in `vite.config.ts` if deploying to Netlify.

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

- [ ] Root HTML shell (TanStack Start entry / route head) has the right `<title>` and description.
- [ ] `<meta name="generator">` is **not** `Webflow` — use something accurate (`TanStack Start`, `Vite + React`, etc.).
- [ ] OG/Twitter meta tags match the original site.
- [ ] Plausible (or agreed analytics) script is present; **no GTM, GA, or Hotjar** unless requested.
- [ ] Favicon + webclip resolve.

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

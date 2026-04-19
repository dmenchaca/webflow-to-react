# Gotchas — Webflow → React migration

Read this file **before** writing any component or animation code. Each gotcha was hit during a real migration and cost time to diagnose. The corresponding `.mdc` rules under `rules/` encode the same content for editor-time surfacing; this file is the consolidated reference.

---

## Fonts {#fonts}

### Files outside the Vite root silently fall back to Arial

Vite's dev server refuses to serve files outside its root. If `.woff2` files live at `<repo-root>/fonts/` and CSS references them as `url("../../fonts/foo.woff2")`, the dev server returns 404 and the browser falls back to the next family in the stack — usually Arial. **You will not see an error**; the design just looks "off."

**Fix:** always put font files in `web/public/fonts/` and reference with root-relative URLs: `url("/fonts/foo.woff2")`.

### `@font-face` must be registered before it's referenced

If `marketing.css` imports `body { font-family: "Plus Jakarta Sans" }` before the `@font-face` rule, some browsers register the body rule against a non-existent family and never retry. Put `@import "./site-fonts.css"` as the **first** import in `marketing.css`.

### Multi-word family names must be quoted

```css
/* WRONG — parser sees three families: Plus, Jakarta, Sans */
font-family: Plus Jakarta Sans, sans-serif;

/* RIGHT */
font-family: "Plus Jakarta Sans", sans-serif;
```

### Webflow uses quirky internal family names

Exports often reference `"Inter 18 Pt"` or `Plusjakartasans`. Keep those strings — the compiled CSS already uses them. Aliasing causes more bugs than it fixes.

### Register one file for multiple weights when the export ships only one

If the export only has `PlusJakartaSans-ExtraBold.woff2`, register it against both 700 and 800 so `font-weight: bold` and `font-weight: 800` both resolve.

### Never default `body` to `Arial`

Some starters do this "for safety." Don't. Inherited text across sections will look wrong wherever the component doesn't explicitly set a font. Use the brand body font on `body` with a sensible fallback stack.

### Copy Webflow’s global font-smoothing (macOS / WebKit)

The export’s **`css/webflow.css`** and often **`index.html`** apply on `*`:

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

TanStack Start + Tailwind entry CSS **does not** include this by default. If you skip it, **macOS Chrome/Safari** keep **subpixel** anti-aliasing — body copy (e.g. Inter) can look **slightly bolder or darker** than production even when `font-family` and `font-weight` match.

**Fix:** add the same two declarations to global base CSS (e.g. `web/src/styles.css` `@layer base` on `*`, alongside border/outline rules). Verify in DevTools → Computed: `-webkit-font-smoothing` is **antialiased** on sample text.

---

## SSR (TanStack Start) {#ssr}

### Browser-only code must not run on the server

TanStack Start **SSR** executes React on the server first. **`window`**, **`document`**, **`localStorage`**, **GSAP** (unless guarded), and **scroll/resize listeners** must live in **`useEffect`**, lazy client-only components, or patterns documented by TanStack Start for client boundaries.

**Symptoms if you get this wrong:** hydration mismatch warnings, `ReferenceError: window is not defined` in logs, or animations firing twice.

### Global CSS still imports on the server

Import the Webflow marketing CSS barrel from **`routes/__root.tsx`** (or equivalent root layout) so SSR HTML includes linked styles. Do not rely only on client-only `<link>` injection for critical layout CSS.

### The export’s `<head>` does not migrate by itself (TanStack Start)

TanStack Start controls the document via **`src/routes/__root.tsx`** `head()` (and the shell component), **not** a checked-in `web/index.html`. The Webflow **`index.html`** `<title>`, **description**, **Open Graph / Twitter** tags, **favicon / apple-touch-icon** links, **theme-color**, and **analytics** (`<script defer …>`) must be **ported explicitly** into the root route — otherwise they silently disappear while `public/images/favicon.png` still exists on disk.

**Fix:** During migration, copy `<head>` contents into a small module (e.g. `web/src/site/seo.ts`) and return them from `createRootRoute({ head: () => ({ meta: [...], links: [...] }) })`. Use **absolute URLs** for `og:image` / `twitter:image` (prefix with `https://your-domain`). Re-read the export’s `index.html` before calling the migration done — see [checklists/cleanup-before-done.md](checklists/cleanup-before-done.md) § HTML shell / meta.

### `useTouchClass` and similar

Hooks that touch `document.documentElement` belong in effects that run **after** mount — same as SPA, but SSR will skip the body until hydrated; ensure the hook no-ops when `typeof document === 'undefined'`.

---

## Netlify + TanStack Start {#netlify}

### Use `[build] base = "web"` in repo-root `netlify.toml`

The official pattern is a **`netlify.toml` at the repository root** with:

```toml
[build]
  base = "web"
  command = "npm ci && npm run build"
  publish = "dist/client"
```

Here **`publish`** is relative to **`base`**, so the deployed folder is **`web/dist/client`**. Setting **`publish = "web/dist/client"`** alongside **`base = "web"`** is wrong — Netlify resolves **`web/web/dist/client`**.

### Do not ship with only `npm --prefix web` from repo root

Running **`npm ci --prefix web && npm run build --prefix web`** from the repo root **without** **`[build] base`** can produce **`web/dist/client`** on disk but fail to attach **`@netlify/vite-plugin-tanstack-start`** output (under **`web/.netlify/`** — SSR serverless handler, redirects). Symptom: deploy “succeeds,” logs may show **`0 new file(s)`** / **`0 new function(s)`**, and the site shows Netlify’s generic **“Page not found”** even though Vite listed **`dist/client`** assets in the log.

**Fix:** use **`[build] base = "web"`** and a normal **`npm ci && npm run build`** in `netlify.toml` (see [templates/netlify.toml](templates/netlify.toml)).

### Never put `netlify.toml` in the Netlify “Build command” field

The dashboard **Build command** is a **shell command**. Any non-empty value **overrides** `netlify.toml`. Typing the literal filename **`netlify.toml`** does not load the file — it runs a bogus command and breaks builds.

### Leave dashboard build fields empty when using `netlify.toml`

Prefer **empty** Build command, Base directory, Package directory, and Publish directory in the UI so the committed file is authoritative. If any field is filled incorrectly, it overrides the file.

### Netlify UI can mirror Base ↔ Package directory

Some users cannot clear **Package directory** while **Base** is set (the UI enforces a `web/` prefix or duplicates values). Rely on **file-based config** at the repo root; see [shipping.md](shipping.md) §2.1.

### Custom domain still 404

If **\*.netlify.app** works but the **apex domain** 404s, check **Domain management** (DNS / Netlify DNS) — not the same class of bug as miswired `publish`/`base`.

### `web/netlify.toml` for local `vite dev`

`@netlify/vite-plugin` sets **`repositoryRoot` = Vite root (`web/`)**. If the only config is repo-root `netlify.toml` with **`[build] base = "web"`**, Netlify resolves **`web/web`**. Add **`web/netlify.toml`** (no `base`; `publish = "dist/client"`) — see **[templates/web-netlify.toml](templates/web-netlify.toml)**. Production CI still uses the **root** `netlify.toml`.

---

## Core Web Vitals (Lighthouse / PageSpeed) {#cwv}

Applies to **any** migrated Webflow site: scores depend on CSS weight, fonts, hero images, and third-party scripts — not one-size-fits-all numbers.

### Render-blocking CSS

Vite emits a **main stylesheet** (Tailwind + copied Webflow CSS). Browsers treat it as **render-blocking** until downloaded — PageSpeed will often flag it. **Fully “fixing”** that without visual regressions usually means **critical CSS**, **route-level CSS splitting**, or accepting the audit. Do not hack `media="print" onload` on the **entire** bundle unless you know the tradeoffs.

### Self-hosted fonts: `preload` + `font-display`

Keep **`font-display: swap`** (or `optional`) in **`site-fonts.css`**. For **LCP / CLS**, add **`<link rel="preload" as="font" type="font/woff2" crossorigin>`** in the root route **`head()`** for **only** the **above-the-fold** weights you actually use (derive `href` from `@font-face` paths). See **[templates/site-font-preload.example.ts](templates/site-font-preload.example.ts)**. Too many preloads hurts mobile.

### Third-party analytics and “forced reflow”

A **`defer`** script in `<head>` still runs early enough that lab tools attribute **layout thrash** to it. **Plausible** (and similar small scripts): **inject after `window` `load` + `requestIdleCallback`** via a tiny client-only component — see **[templates/PlausibleLoader.tsx](templates/PlausibleLoader.tsx)** (`VITE_PLAUSIBLE_DOMAIN` in `.env`). **Google Tag Manager** is a different beast (tag manager + tags); do not pretend it’s the same pattern — keep GTM out unless the user insists, per migration defaults.

### CLS from Webflow layout (overlays, grids, `%` positioning)

Decorative layers often use **`position: absolute`** with **percentage `inset` / `top`**. When the parent’s height changes (fonts loading, images), overlays **shift**. Add a **last-imported** small override file (e.g. `performance-overrides.css`) with **narrow media queries** and **stable** `inset` / `min-height` only where parity allows — see **[templates/performance-overrides.example.css](templates/performance-overrides.example.css)**. **Inspect the export’s hero** in DevTools; class names differ per site.

### LCP images

For the **largest above-the-fold** image(s) in the hero (logo, illustration), prefer **`loading="eager"`** and **`fetchPriority="high"`** — not `lazy`. Pick images per export; do not lazy-load the obvious LCP candidate.

### App bundle reflow (`routes-*.js`)

**Framer Motion**, **hydration**, and **router** code can still show small “forced reflow” in Lighthouse. That is not fully eliminable on a rich page; prioritize **third-party deferral** and **font/CLS** first.

---

## CSS preservation

### Keep Webflow class names verbatim on JSX

`className="hero-section_wrapper"`, underscores and all. This is what preserves parity and lets the copied CSS "just work."

### Don't translate breakpoints yet

Webflow's breakpoints (typically 479 / 767 / 991 px) don't match Tailwind's. Leave them inside the copied `@media` rules until you do a section's full refactor.

### Rewrite asset URLs

After copying CSS, global-search-and-replace:

- `url("images/` → `url("/images/`
- `url("../images/` → `url("/images/`
- `url("../fonts/` → `url("/fonts/`

### Do the copy-verbatim pass BEFORE any refactor

"Pixel parity first, then refactor" is the only strategy that keeps the site functional at every intermediate commit.

---

## GSAP in React {#gsap}

### Keep the Webflow GSAP animations as-is

If the export ships GSAP, **don't rewrite it in Framer Motion**. Port the existing timelines into `useEffect` with `gsap.context()` and call `ctx.revert()` in cleanup.

```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.hero-title', { y: 40, opacity: 0, duration: 1 })
  }, scopeRef)
  return () => ctx.revert()
}, [])
```

### `gsap.context(fn, scopeRef)` is load-bearing

- Scopes selectors so `.hero-title` only matches inside `scopeRef`.
- `ctx.revert()` kills every tween, ScrollTrigger, and inline style in one call.
- Safe under React 19 StrictMode (the double-effect invocation reverts cleanly between runs).

Forgetting `ctx.revert()` under StrictMode is the most common failure: you see "duplicated" animations playing because the dev-mode double-mount ran the effect twice.

### Register plugins once at module scope

```ts
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)   // ← top of the file, not inside the component
```

### Never call `gsap.to(...)` during render

Only inside `useEffect`. Calling at render time creates duplicate tweens on every re-render.

### Don't mix GSAP with CSS `@keyframes` on the same element

They fight. Pick one per element.

### Webflow Interactions 2.0 are not GSAP

Webflow Interactions 2.0 ship as declarative JSON consumed by `webflow.js`, not as GSAP code. They do **not** transfer. Either drop the interaction or re-create essential ones using GSAP + ScrollTrigger directly — confirm essentials with the user before re-implementing.

### After layout shifts, refresh ScrollTrigger

If content loads async or layout changes post-mount (images resolving, iframes resizing), call `ScrollTrigger.refresh()` to re-measure.

---

## Interactive widgets

### Close button over `<iframe>` — z-index is not enough

Iframes are separate compositor surfaces. Floating a button on top with just `z-index: 999` is unreliable across browsers and device modes.

**Fix:** reserve layout space (padding/margin on the container *above* the iframe) so the close control has its own box. Use an explicit class like `.widget-container--with-close` over CSS `:has()` for the layout variant — `:has()` support is spotty in older Safari WebViews.

### Visibility via IntersectionObserver, not "always visible"

Tie floating-widget visibility to a specific section id, not the viewport at large. Plain `IntersectionObserver` is enough; no animation library required.

### Corner-snap dock must have explicit allowed transitions

Model corner state as a state machine with allowed neighbors (e.g. `bottomRight → {bottomLeft, topRight}`, no diagonals). Otherwise arrow controls become inconsistent.

### Dismissal state: component vs. localStorage

Default to component state — the widget reappears when the user scrolls back to its anchor section, which is usually the right UX. If you add `localStorage` persistence, **document it prominently** — it looks like a bug when the widget doesn't come back.

---

## Hover / overlay effects

### Blur-reveal surfaces — don't also animate background-color

If the design uses `backdrop-filter: blur()` to reveal content behind a surface on hover (typical for logo grids with a hidden CTA), **don't** layer a color transition on the same surface. The color shift reads as a separate visual bug and muddies the blur reveal.

---

## Dev server / HMR

### HMR does not always self-heal after bad states

Invalid hook errors, undefined imports, or module graph corruption during hot reload can leave the tree broken even after source is fixed. **Restart Vite** (`Ctrl-C` → `npm run dev`). Don't chase phantom errors.

### Port collisions

Default dev port is 5173 (Vite's default; `vite.config.ts` does not override). If something else is bound, Vite picks 5174. Verify with `lsof -i :5173` before assuming the right app is open.

---

## Stack detection (Wappalyzer, BuiltWith)

### Update the `generator` meta tag

Webflow exports include `<meta name="generator" content="Webflow">`. After migration, change it to something accurate (e.g. `TanStack Start + React` or `Vite + React`). Wappalyzer and BuiltWith will otherwise keep reporting "Webflow."

### Prerendering hides React from detectors

If you add SSR/SSG later, detection tools infer the stack from the rendered HTML and may miss React entirely. That's fine for users; just know detectors' limits.

---

## Migration mindset

### No more Webflow re-exports

After the initial copy, the React codebase is the source of truth. Keep the root-level `index.html` only as a read-only diff reference.

### Progressive over big-bang

Start with Webflow CSS verbatim → wrap HTML in React sections → port GSAP into `useEffect` → incrementally migrate CSS to Tailwind utilities. The site is functional at every intermediate step. Never attempt a parallel full rewrite.

### Repo cleanup is safe once behavior is replicated

You can delete `webflow.js`, `jquery*.js`, HTML fragments, and third-party analytics snippets — but verify each replacement is live first. A hidden `data-w-id` script that turned out to power a tab was a real footgun.

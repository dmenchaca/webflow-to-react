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

**Fix:** During migration, copy `<head>` contents into a small module (e.g. `web/src/site/seo.ts` — see [templates/site-seo.example.ts](templates/site-seo.example.ts)) and return them from `createRootRoute({ head: () => ({ meta: [...], links: [...] }) })`.

**TanStack Router `head()` shape — `<title>` is not a top-level key.** Only `meta`, `links`, `scripts`, and `styles` from the object returned by `head()` are read into the match. A top-level `title: '…'` is **silently ignored** — there will be no `<title>` in SSR HTML. Put the document title in the **`meta` array** as `{ title: '…' }` (conventionally **last** in the array so it wins when multiple routes merge head). Example:

```ts
head: () => ({
  meta: [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: siteSeo.description },
    { property: 'og:title', content: siteSeo.ogTitle },
    // …
    { title: siteSeo.title },
  ],
  links: [/* … */],
})
```

Use **absolute URLs** for `og:image` / `twitter:image` (prefix with `https://your-domain`). Re-read the export’s `index.html` before calling the migration done — see [checklists/cleanup-before-done.md](checklists/cleanup-before-done.md) § HTML shell / meta.

### `useTouchClass` and similar

Hooks that touch `document.documentElement` belong in effects that run **after** mount — same as SPA, but SSR will skip the body until hydrated; ensure the hook no-ops when `typeof document === 'undefined'`.

### Netlify SSR function crashes on first request: `Cannot use import statement outside a module` / `ERR_REQUIRE_ESM` {#ssr-noexternal}

This is the most common production-only failure mode after a green Netlify build. The build succeeds, the static site assets upload, but the **server function** (`web/.netlify/v1/functions/server.mjs` for TanStack Start + `@netlify/vite-plugin-tanstack-start`) crashes the first time it tries to render a route. The Netlify error page shows one of:

- **`SyntaxError: Cannot use import statement outside a module`** with `node:internal/modules/cjs/loader` in the stack — Node loaded an ESM-only file (e.g. `node_modules/<pkg>/index.js`) through the **CommonJS** loader.
- **`Error [ERR_REQUIRE_ESM]: require() of ES Module …`** — a CJS file inside a package called `require()` on an ESM-only sibling (`html-react-parser` → `domhandler` is a real example, but it can be **any** dep with the same shape).

**Why `npm run build` does not catch this.** Vite's build is a bundler step. It does **not** start the function and import its code through Node's loader. Local **`vite dev`** uses Vite's transform pipeline, not the production CJS/ESM rules. The crash only happens when Node actually executes the function on Lambda — i.e. on the **first real request** after deploy.

**Why this happens.** TanStack Start's SSR build externalizes `node_modules` into the Netlify function bundle by default, and Netlify traces those files into `/var/task/node_modules/...`. If a traced file is **ESM-only** but lands in a context Node treats as CJS (or vice versa), the loader throws. Common offender shapes:

- Package `index.js` is ESM (`"type": "module"` or top-level `import` statements) but no `require` entry in `exports`.
- A package's CJS file contains `require('<sibling>')` where `<sibling>`'s newer version is ESM-only.

**Fix — bundle the offending package into the SSR chunk.** Add it to **`ssr.noExternal`** in `web/vite.config.ts`. Vite then **inlines** the package into `dist/server/assets/routes-*.js` and the Netlify function never reads the raw file, sidestepping Node's loader rules entirely.

```ts
// web/vite.config.ts
export default defineConfig({
  ssr: {
    // Append the package(s) named in the Netlify function stack trace.
    // Add transitive dependencies if they show up in subsequent crashes.
    noExternal: [
      // '<package-from-stack-trace>',
      // '<its-esm-only-sibling-if-mentioned>',
    ],
  },
  // …plugins
})
```

**Diagnostic recipe (any site, any package).**

1. Read the Netlify function error page. The first line of the stack trace contains `/var/task/node_modules/<pkg>/<file>` — that is the package to add.
2. If the message is `require() of ES Module …`, both the **caller** package and the **ESM sibling** named in the message are candidates. Add the package being loaded; in stubborn cases add its parent too.
3. Rebuild locally and run the **SSR import smoke test** below. Repeat for any new package the trace surfaces — these errors usually unmask one at a time.
4. Push, redeploy, hit the live URL once.

**Local SSR smoke test (catches this class of bug pre-deploy).**

```bash
cd web && npm run build && \
  node -e "import('./.netlify/v1/functions/server.mjs')\
    .then(() => console.log('SSR import OK'))\
    .catch(e => { console.error('SSR import FAILED:', e); process.exit(1) })"
```

This imports the same function entry Netlify will run, through the same Node loader, against the same `node_modules`. If it logs `SSR import OK`, the function will at least start on Netlify. (It still does not exercise route handlers — for that, run `netlify dev`.)

**What not to do.**

- Do **not** patch `node_modules` or hand-edit the function output.
- Do **not** assume which package is at fault on a new site — exports differ per Webflow project (one site uses `gsap`, another adds `html-react-parser`, another a CMS SDK). The list below is **observed examples**, not a default config: `gsap`, `html-react-parser`, `html-dom-parser`, `domhandler`, `react-property`, `style-to-js`, `style-to-object`, `inline-style-parser`. Add only what the **current site's** stack trace and smoke test demand.
- A third failure mode: **`Cannot find module '<pkg>'`** with `Require stack` pointing at `server.mjs` — Netlify’s dependency trace did not copy a **transitive** package into the function bundle. Treat it like `noExternal`: add `<pkg>` to **`ssr.noExternal`**, rebuild, rerun the SSR smoke test.
- If a dep is genuinely browser-only (e.g. a canvas/Rive runtime), the better fix is to **dynamic-import it inside a client effect** rather than bundling it into the server chunk — see § *Browser-only code must not run on the server*.

### Raw `html-react-parser` / string HTML is a foot-gun {#html-react-parser-footgun}

Dumping the export body into a string and `parse(html)` preserves **every** Webflow class and **`data-w-id`**, but **`webflow.js` is gone** — so **Interactions 2.0**, **navbar component JS**, **dropdown / tabs / slider / lightbox** behaviors, and **Finsweet** (`fs-*` attributes) do **not** run. There is often **no build error**; the page just renders the wrong visual or interactive state.

**Mandatory follow-up after a `parse(html)` pass:** run the **interactivity audit** in [checklists/cleanup-before-done.md](checklists/cleanup-before-done.md) § *Webflow interactivity audit*.

### Webflow `webflow.js` behaviors that silently break {#webflow-runtime-lost}

These are **site-specific** in markup, but the **failure mode** is the same on every export once `webflow.js` is removed:

| Pattern | Symptom | Fix direction |
|--------|---------|----------------|
| **Dual navbar / scroll swap** — e.g. a **fixed** wrapper (often `.hidden-nav` with `transform: translate(0,-100%)`) containing an `is-white` bar, **plus** a second `w-nav` in the hero (`is-no-bottom-border`, e.g. `#hero-nav`) | At top: both visible or wrong bar; on scroll: white bar never slides in | Drive the same CSS states with **`data-navbar-scrolled`** (or a class) on `<html>` from a **`scroll` listener** in `useEffect`, plus CSS `transition` on `transform` / `opacity` — mirror the two Webflow states exactly. |
| **`w-nav` mobile menu** — `.w-nav-button`, `.w-nav-menu`, `data-collapse` | Hamburger does nothing | Toggle **`w--open`** on the button and **`data-nav-menu-open`** on the menu (see Webflow’s CSS) from a click listener; close on in-page `#` link clicks. |
| **`w-dropdown`** — `.w-dropdown-toggle`, `.w-dropdown-list.w--open` | Dropdown never opens | `mouseenter` / `mouseleave` on `.w-dropdown` when `data-hover="true"`, else click toggle; match `.w--open` on list + toggle. |
| **`w-tabs`, `w-slider`, `w-lightbox`, `w-form`** | Tabs, sliders, lightbox, form validation broken | Re-implement with React state or small vanilla controllers; or keep Webflow’s runtime (usually not desired). |
| **IX2 pre-hide `<style>` in export `<head>`** — selectors like `html.w-mod-js:not(.w-mod-ix) [data-w-id="…"]` | If you add **`w-mod-ix`** globally without IX2, pre-hide rules never apply and **initial states** (opacity, height) differ from production | Either remove/replace those rules after porting the interaction, or reproduce the **end state** of each IX2 timeline in CSS/JS. |
| **Finsweet** — `fs-scrolldisable-element`, `fs-*` | Attribute has no effect | Load the same Finsweet script the export used, or remove the attribute and implement the behavior in React. |

The skill’s GSAP section correctly says IX2 JSON does not transfer — extend that mentally to **all** `w-*` component JS, not only “scroll animations.”

### Post-deploy HTML verification {#post-deploy-html}

TanStack Start can stream a **fallback** comment (`Switched to client rendering because the server rendering errored`) when SSR throws — the deploy still looks “green.” **Always** fetch the production URL once and check:

```bash
curl -sS 'https://YOUR_SITE.netlify.app/' | tr -d '\0' | grep -E '<title>|Switched to client rendering|data-msg='
```

Expect a real `<title>…</title>` and **no** `Switched to client rendering`. See [checklists/cleanup-before-done.md](checklists/cleanup-before-done.md) § *Post-deploy HTML verification*.

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

### Mission critical: Netlify UI build settings must stay empty {#netlify-ui-empty}

**Non-negotiable for TanStack Start + `@netlify/vite-plugin-tanstack-start`:** After you link the Git repo, open **Site configuration → Build & deploy → Build settings** (sometimes **Configure builds**). **Every override the UI allows must be cleared** so the **repo-root `netlify.toml`** is the **only** source of truth. If **any** of these fields is set in the dashboard, Netlify may **ignore or fight** the TOML — you get “successful” deploys with **wrong publish roots**, **missing SSR functions**, **404s**, or **stale `netlify/functions`** layouts.

**Clear / leave “Not set” (verify after every UI visit — Netlify sometimes re-fills defaults):**

| UI field | Why it must be empty |
|----------|------------------------|
| **Runtime** | Let the build use the project’s Node from `netlify.toml` / default unless you have a documented exception. |
| **Base directory** | Must **not** be `/`, `web`, or anything else here when using **`[build] base = "web"`** in the file — dashboard **Base** overrides or duplicates the monorepo root and breaks the mental model (`web/web`, wrong `cwd`, wrong artifact paths). |
| **Package directory** | Empty. Only monorepo docs that explicitly require it are an exception. |
| **Build command** | Empty. A non-empty value **replaces** `netlify.toml`’s `command` — including the useless mistake of typing **`netlify.toml`** as the command. |
| **Publish directory** | Empty. A wrong value → static files from the wrong folder or **Page not found** while `dist/client` exists elsewhere. |
| **Functions directory** | Empty / **not** `netlify/functions`. This stack’s SSR handler is emitted by the Vite plugin under **`web/.netlify/`** during **`npm run build`** in `web/`. A legacy **`netlify/functions`** path makes Netlify watch the **wrong tree** — functions never attach, SSR routes crash or 404. |

**Agent / user checklist:** Click **Configure**, clear overrides, **Save**, open **Build settings** again and confirm nothing came back. Treat “I only changed one field” as a **deploy risk**.

See **[shipping.md](shipping.md) §2.1** for the same rule in the ship flow.

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

Not every export uses analytics; when it does, it may be **GTM, GA, Meta Pixel, Plausible, Fathom**, etc. — **ask or follow the user**, do not default to one vendor.

A **`defer`** script in `<head>` still runs early enough that lab tools attribute **layout thrash** to it. For **small first-party-style** scripts (e.g. **Plausible** or **Fathom**), prefer **injecting after `window` `load` + `requestIdleCallback`** via a tiny client-only component — see **[templates/PlausibleLoader.tsx](templates/PlausibleLoader.tsx)** as an example **only when Plausible is chosen** (`VITE_PLAUSIBLE_DOMAIN` in `.env`); adapt the URL/domain pattern for other hosts. **Google Tag Manager** is a different beast (tag manager + tags); do not treat it like a single defer script — scope and performance tradeoffs differ; only add if the user requires it.

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
import ScrollTrigger from 'gsap/ScrollTrigger' // default export — named `{ ScrollTrigger }` breaks some SSR bundlers
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

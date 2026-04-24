# Playbook — Webflow export → TanStack Start (React + SSR)

> Read [SKILL.md](SKILL.md) first. **First-time ship:** [shipping.md](shipping.md) (GitHub MCP + Netlify + auth fallbacks). Failure modes: [gotchas.md](gotchas.md).

## 1. Audit the export (do NOT edit it)

Catalog, don't touch:

- Top-level sections in `index.html` → map to route components or section components.
- Font files in `fonts/` → note every weight/style file; check which `font-family` names the CSS references.
- Compiled CSS under `css/` — typically one large site-specific file + `normalize.css` + `webflow.css`.
- `js/` folder:
  - `jquery*.js`, `webflow.js` → **drop**, replaced by React.
  - `gsap*`, `ScrollTrigger*`, `SplitText*`, any custom GSAP code → **keep**, port to **client-only** `useEffect` + `gsap.context()` (see §8).
- Analytics scripts in `<head>` — catalog; replacement is **user-dependent** (none, Plausible, Fathom, keep GA via GTM, etc.).
- Hidden sections in the export — if the ZIP **does not** include `w-hidden` / `hide` on nodes that are hidden in the **live** Designer, see [gotchas.md](gotchas.md) — you may need to add classes manually after comparing to production.
- Dead HTML pages (`style-guide.html`, `401.html`, `404.html`) — drop unless asked.

## 2. Repo layout (TanStack Start in `web/`)

```text
<repo-root>/
  index.html  css/  fonts/  images/  js/     # original Webflow export, read-only reference
  package.json                               # proxy scripts only → web/
  README.md  netlify.toml
  web/                                       # TanStack Start app
    vite.config.ts       # tanstackStart() + @netlify/vite-plugin-tanstack-start
    package.json
    public/
      fonts/   images/   # copied from export; URLs in CSS → /fonts /images
    src/
      routes/
        __root.tsx       # root layout: global CSS, shell, head() meta/links, providers
        index.tsx        # home route (marketing page)
      site/
        seo.ts           # optional: title, description, OG/Twitter from export index.html
        ...
      styles/
        marketing.css
        site-fonts.css
        marketing/       # compiled Webflow CSS split by concern
      components/
        HomeBody.tsx
        MarketingSiteRoot.tsx
        home/sections/...
      hooks/
      lib/
```

TanStack Start generates `router.tsx`, `routeTree.gen.ts`, etc. — **keep the generator output**; add Webflow files alongside.

## 3. Bootstrap order

### 3.1. Root `package.json` (proxy)

Create at repo root — only proxy scripts. See `templates/root-package.json`.

### 3.2. Scaffold TanStack Start inside `web/`

From repo root (empty `web/` or move scaffold after):

```bash
# Official CLI (package manager examples — use one)
pnpm dlx create-start-app@latest web
# or: npx create-start-app@latest web
```

Choose **React** when prompted. `cd web` and verify `pnpm dev` / `npm run dev` works.

### 3.3. Netlify hosting plugin (SSR)

Per TanStack Start hosting guide:

```bash
cd web
pnpm add -D @netlify/vite-plugin-tanstack-start
```

In `vite.config.ts`, add the Netlify plugin alongside `@tanstack/react-start/plugin/vite` and `@vitejs/plugin-react`. Order can match [TanStack Start — Netlify hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).

### 3.4. Install migration dependencies

Same stack as before (Tailwind v4, shadcn, optional GSAP, etc.). Install **inside `web/`**:

```bash
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
pnpm add -D tailwindcss @tailwindcss/vite tw-animate-css shadcn
# optional: cssstudio for dev CSS studio
```

**Conditional:** `gsap`, `@rive-app/canvas`, `framer-motion` — only if needed.

### 3.5. Tailwind + shadcn

Initialize Tailwind v4 and shadcn per their current docs (TanStack Start uses Vite under the hood). Use `components.json` from templates as a **reference**; merge paths with TanStack’s `src/` layout.

### 3.6. Merge templates (not wholesale overwrite)

Copy **patterns** from `templates/site-fonts.css`, `templates/marketing.css`, `MarketingSiteRoot.tsx` into `web/src/`. Import global styles from **`routes/__root.tsx`** (or the documented root layout file) so SSR receives the same CSS as the client.

### 3.6b. Port `index.html` `<head>` (required for TanStack Start)

The Webflow export’s **`index.html`** is no longer the HTML shell once you use TanStack Start — the document comes from **`web/src/routes/__root.tsx`**. You must **manually lift**:

- `<title>`, `<meta name="description">`, **Open Graph** / **Twitter** tags, `theme-color`
- `<link rel="icon">` / **shortcut icon**, **apple-touch-icon** (paths under `public/` stay `/images/...`)
- Third-party **analytics** (`<script defer …>`), unless the user asked to omit them

Centralize strings in something like **`web/src/site/seo.ts`** ([templates/site-seo.example.ts](templates/site-seo.example.ts)) and return `meta` / `links` from the root route’s `head()` so SSR and social previews match the old site. **`<title>` must be `{ title: siteSeo.title }` inside the `meta` array** — a top-level `title` on the `head()` return object is ignored by TanStack Router. See [gotchas.md](gotchas.md) § *The export’s `<head>` does not migrate by itself*.

Also copy **global `*` rules** from **`css/webflow.css`** (or the `<style>` blocks in the export `index.html`) into your global stylesheet — at minimum **`-webkit-font-smoothing: antialiased`** and **`-moz-osx-font-smoothing: grayscale`**. Webflow relies on these for consistent text weight on macOS; TanStack/Tailwind shells omit them by default. See [gotchas.md](gotchas.md) § *Copy Webflow’s global font-smoothing*.

### 3.6c. Optional — static `sitemap.xml` and `robots.txt`

Files in **`web/public/`** are served at the site root (Vite behavior; same as the [TanStack Start SEO guide](https://tanstack.com/start/v0/docs/framework/react/guide/seo)). If the migration needs crawlers to discover URLs or a `robots.txt` policy, add **`web/public/sitemap.xml`** and/or **`web/public/robots.txt`**. They require no `head()` wiring.

Use **[templates/sitemap.xml.example](templates/sitemap.xml.example)** and **[templates/robots.txt.example](templates/robots.txt.example)** as starting points; replace hostnames and paths with the **production** domain and the routes you actually ship. For many pages or build-time discovery, prefer TanStack’s **prerender** + sitemap options in the Vite plugin; for CMS-backed URLs, use a **server route** (see the guide).

### 3.6d. Document shell — stack scanners (Wappalyzer, BuiltWith)

When porting the export into **`__root.tsx`**, do **not** blindly copy **`data-wf-page`** / **`data-wf-site`** on `<html>`. Confirm with a repo search that **no** `data-wf-` selectors exist in **`web/src/styles`**; then **omit** those attributes — they are editor metadata and trigger false “Webflow” hits in stack detectors.

**Do** keep the **`w-mod-js` / `w-mod-touch` / `w-mod-ix`** bootstrap (inline script or equivalent) if **`webflow.css`** or bundled CSS still targets **`html.w-mod-*`**. **Do** set **`generator`** meta to the real stack and move **OG/Twitter images** off **`uploads-ssl.webflow.com`** when you want social previews and URLs to match your domain.

See [gotchas.md](gotchas.md) § *Stack detection* and [rules/stack-detection-webflow.mdc](rules/stack-detection-webflow.mdc).

### 3.7. shadcn primitives on demand

```bash
cd web && npx shadcn@latest add button tooltip
```

## 4. Migrate assets

Same as Vite SPA:

- `cp -R <root>/images/* web/public/images/`
- `cp <root>/fonts/* web/public/fonts/` (woff2/woff/ttf as exported)
- Rewrite CSS URLs to `/images/...`, `/fonts/...`

See [gotchas.md § Fonts](gotchas.md#fonts).

## 5. Migrate CSS

Same **verbatim Webflow CSS** strategy as before. Barrel `marketing.css` with **`@import "./site-fonts.css"` first**.

Import the marketing barrel in the **root layout** (`__root.tsx`) so SSR includes styles:

```tsx
import '../styles/marketing.css'
```

(Adjust path to match your file layout.)

### 5.x Tailwind + `index.css`

Keep Tailwind entry (`src/styles.css` or `index.css` — follow TanStack starter) and align `@theme` font tokens with `site-fonts.css`.

## 6. Build the route + component tree

### 6.1. TanStack Router

- **Home page:** implement the migrated markup in `src/routes/index.tsx` (or split into `components/home/sections/*` imported by that route).
- **`__root.tsx`:** wrap with `MarketingSiteRoot` / providers (e.g. `TooltipProvider` if using shadcn tooltips).

### 6.2. Section order

Match Webflow `index.html` section order. Keep wrapper classes (`page-wrapper`, `main-wrapper`, etc.) verbatim.

### 6.3. JSX rules

Same as legacy playbook: `className`, void tags, inline styles, preserve classes for parity.

## 7. Replace runtime behavior

Same mapping table as before (nav, tooltips, iframes, touch class, analytics if any). Hooks stay in `src/hooks/` and run in client components / `useEffect`.

## 8. GSAP + SSR

TanStack Start renders on the **server**. **GSAP, `window`, `document`, and browser-only APIs must not run during SSR.**

- Put GSAP init only in `useEffect` or in files marked with **`client-only`** patterns per TanStack Start docs (e.g. `use client` boundaries if using that convention, or lazy client components).
- Keep `gsap.context()` + `ctx.revert()` as in [rules/gsap-in-react.mdc](rules/gsap-in-react.mdc).

### 8.1. Pattern: `useEffect` + `gsap.context()`

(Same code as before — runs only after hydration.)

### 8.2–8.3

Same “don’t rewrite in Framer Motion” and Webflow Interactions 2.0 notes as the previous playbook.

## 9. Deploy config (Netlify + TanStack Start)

Root `netlify.toml` — use **`templates/netlify.toml`** in this skill. Typical shape:

```toml
[build]
  base    = "web"
  command = "npm ci && npm run build"
  publish = "dist/client"
```

With **`[build] base = "web"`**, **`publish`** is relative to **`base`** (so on disk that is **`web/dist/client`** from the repo root). Do **not** set `publish = "web/dist/client"` in the same file — that would incorrectly resolve to **`web/web/dist/client`**.

**Mission critical — Netlify dashboard:** In **Build & deploy → Build settings**, leave **Runtime, Base directory, Package directory, Build command, Publish directory,** and **Functions directory** **empty / Not set**. Filled UI fields **override `netlify.toml`** and routinely cause **404s**, **missing SSR functions**, or **`netlify/functions`** mismatches. See [gotchas.md](gotchas.md) § *Mission critical: Netlify UI*.

**Always** run `npm run build` locally in `web/` once and confirm the output folder (`dist/client` vs `dist/...`). TanStack Start + Netlify plugin may change paths between versions — adjust `publish` to match **actual** output.

Do **not** ship with only `npm ci --prefix web && npm run build --prefix web` from the repo root **without** `[build] base` in `netlify.toml` — the Netlify Vite plugin needs the build to run with **cwd = `web/`** so SSR/functions under **`.netlify/`** deploy correctly (see [gotchas.md](gotchas.md) § Netlify).

Install `@netlify/vite-plugin-tanstack-start` in `web/` (see §3.3).

### 9.1. `web/netlify.toml` (local dev)

Copy **[templates/web-netlify.toml](templates/web-netlify.toml)** to **`web/netlify.toml`** so `vite dev` does not resolve **`web/web`** when the Netlify Vite plugin uses **`web/`** as config root. Keep repo-root **`netlify.toml`** for production (see §9).

### 9.2. Core Web Vitals (optional, any site)

After visual parity, optionally improve Lighthouse / PageSpeed:

1. **Font preloads** for hero-critical **woff2** files — [templates/site-font-preload.example.ts](templates/site-font-preload.example.ts); wire into **`__root.tsx` `head()`** before the main stylesheet.
2. **Deferred lightweight analytics** — if the site uses **Plausible**, see [templates/PlausibleLoader.tsx](templates/PlausibleLoader.tsx) (`VITE_PLAUSIBLE_DOMAIN` in **`web/.env`**). For **other** scripts, use the same **load + idle** injection idea or the vendor’s documented snippet; **skip** if the user wants no analytics.
3. **CLS overrides** — last-imported CSS — [templates/performance-overrides.example.css](templates/performance-overrides.example.css); tune selectors per **that** export’s markup.
4. **LCP images** — **`loading="eager"`** + **`fetchPriority="high"`** for obvious hero images; keep **`lazy`** below the fold.

Details and limits (e.g. render-blocking CSS): [gotchas.md](gotchas.md) § Core Web Vitals.

## 10. First-run ship (GitHub + Netlify)

**Mandatory on first migration** when the user wants the project online:

1. Follow **[shipping.md](shipping.md)** end-to-end.
2. Prefer **GitHub MCP** `create_repository` + `git push`.
3. If MCP auth fails, use `gh auth login` or manual repo creation — **do not** block silently.
4. Connect **Netlify** to the GitHub repo (dashboard or `netlify login` + `netlify init`). **Clear all Build settings overrides** in the Netlify UI — see §9 / [gotchas.md](gotchas.md) § *Mission critical: Netlify UI*.
5. Share the Netlify URL with the user.

## 11. Scaffold rules into the new project

```bash
mkdir -p .cursor/rules
cp ./rules/*.mdc .cursor/rules/   # from cloned skill repo; or ~/.cursor/skills/webflow-to-react/rules/ if installed globally
```

## 12. Cleanup / ship gate

Run [checklists/cleanup-before-done.md](checklists/cleanup-before-done.md).

## 13. After migration

- No more Webflow re-exports as source of truth.
- Add new marketing **routes** with TanStack Router as the site grows (`/blog`, `/legal`, …).
- Progressive CSS → utility refactors one section at a time.

## Appendix A — Legacy: Vite SPA only (no TanStack Start)

If the user **explicitly** requests a **plain Vite + React SPA** (no SSR):

1. `npm create vite@latest web -- --template react-ts`
2. Follow older steps: single `main.tsx`, `index.html` at `web/`, `publish = "dist"` in Netlify.
3. Skip TanStack Start–specific plugins and `dist/client` paths.

Do **not** use this appendix unless the user opts out of TanStack Start.

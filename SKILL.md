---
name: webflow-to-react
description: >-
  Converts a Webflow HTML export into a maintainable React app with TanStack Start
  (SSR, TanStack Router conventions) and pixel parity on day one. Use when the
  user has a Webflow export (index.html + css/ + js/ + images/ + fonts/) and
  wants to migrate to React, when they mention TanStack Start, TanStack Router,
  SSR, "convert Webflow to React", or when a repo already contains a Webflow
  export at its root. Covers folder layout, font self-hosting, CSS preservation,
  global-effect hooks, first-run GitHub + Netlify ship (MCP + auth fallbacks),
  optional Core Web Vitals patterns (font preload, deferred analytics, CLS tweaks;
  adapt per export), and GSAP kept intact (not rewritten in Framer Motion).
---

# Webflow → TanStack Start (React) migration

Turns a Webflow HTML export into a **TanStack Start** app (SSR + file-based routing via TanStack Router) with **pixel parity from day one**, then progressive refactors. Strategy: **copy CSS verbatim, wrap HTML in JSX, keep GSAP in client boundaries, replace jQuery/webflow.js with hooks**.

**First-time migration ship:** If this is the **first** conversion of that site, the agent should **ship to a new private GitHub repo** (prefer **GitHub MCP** `create_repository`) and **connect Netlify** to that repo with the correct build/publish settings. Users may not be logged in — follow **[shipping.md](shipping.md)** for MCP failures and `gh` / dashboard fallbacks.

## When to use this skill

- The user has a Webflow export folder (`index.html`, `css/`, `fonts/`, `images/`, `js/`).
- They want a maintainable React codebase aligned with **TanStack** (Router, optional Query/Table later).
- They want **SSR** without bolting on a second framework.
- They want to keep Webflow visuals and GSAP behavior.

## Quick workflow

```
Migration progress:
- [ ] 1. Audit the export (sections, fonts, JS, animations, analytics)
- [ ] 2. Bootstrap web/ with TanStack Start (React) + TS
- [ ] 3. Add Netlify Vite plugin for TanStack Start (hosting)
- [ ] 4. Install deps (Tailwind v4, shadcn, GSAP if present, …)
- [ ] 5. Wire root package.json proxy scripts (repo root → web/)
- [ ] 6. Move assets → web/public/{images,fonts}/ (rewrite URLs to /)
- [ ] 7. Copy compiled Webflow CSS → web/src/styles/marketing/
- [ ] 8. Write web/src/styles/site-fonts.css (@font-face FIRST)
- [ ] 9. Write web/src/styles/marketing.css barrel in the right order
- [ ] 10. Integrate marketing styles in TanStack root layout (__root.tsx) + routes
- [ ] 10b. **Port the export `index.html` `<head>`** into `__root.tsx` (title, description, OG/Twitter, favicon links, theme-color, analytics/scripts if any) — TanStack Start has no static `index.html`; skipping this loses SEO and icons even when assets exist in `public/`
- [ ] 10c. **Global font-smoothing:** copy Webflow’s `* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale }` (from `css/webflow.css` / `index.html`) into the app’s global CSS (e.g. `styles.css` `@layer base`) — without it, macOS often renders text **heavier** than production (see [gotchas.md](gotchas.md) § *Copy Webflow’s global font-smoothing*)
- [ ] 11. Port sections into routes or components under web/src/
- [ ] 12. Keep GSAP in client-only code (useEffect + gsap.context); drop jQuery/webflow.js
- [ ] 13. Analytics: follow the **export + user** (remove/replace GTM/GA/Hotjar per agreement — not every site uses Plausible; see [gotchas.md](gotchas.md)); set generator meta in HTML shell
- [ ] 13b. **Optional CWV:** `web/netlify.toml` from [templates/web-netlify.toml](templates/web-netlify.toml); font preloads / deferred third-party scripts / hero image priorities per [gotchas.md](gotchas.md) § Core Web Vitals
- [ ] 14. Scaffold .cursor/rules/* into the new project (see rules/)
- [ ] 15. **SSR import smoke test** before pushing — `vite build` is not a runtime check; see [gotchas.md](gotchas.md) § *Netlify SSR function crashes on first request* and [templates/vite-ssr-noexternal.example.ts](templates/vite-ssr-noexternal.example.ts). Per-site list, do not copy verbatim from another project.
- [ ] 16. First-run ship: GitHub repo + Netlify — see shipping.md
- [ ] 17. Open the live URL after deploy — Netlify “build success” does not exercise the function
- [ ] 18. Run cleanup checklist (checklists/cleanup-before-done.md)
```

## Required reading before acting

1. **[playbook.md](playbook.md)** — bootstrap order, TanStack Start layout, CSS, components.
2. **[shipping.md](shipping.md)** — **first-run** GitHub (MCP) + Netlify + **unauthenticated** fallbacks.
3. **[gotchas.md](gotchas.md)** — fonts, SSR vs client-only hooks, **Netlify + TanStack deploy (`[build] base`, `web/netlify.toml`, UI overrides)**, **Core Web Vitals**, GSAP, iframes.
4. **[checklists/pre-migration.md](checklists/pre-migration.md)**
5. **[checklists/cleanup-before-done.md](checklists/cleanup-before-done.md)**

## Templates

Copy/adapt from `templates/`. TanStack Start also generates its own `vite.config.ts`, `src/routes/` — merge Webflow patterns into that structure rather than replacing the whole scaffold.

- `templates/root-package.json` — proxy scripts to `web/`
- `templates/web-package.json` — **reference only**; prefer versions from TanStack Start + your additions
- `templates/netlify.toml` — production CI (repo root); **`templates/web-netlify.toml`** — local `vite dev` / Netlify plugin root = `web/`
- `templates/PlausibleLoader.tsx` (example **only if** the project uses Plausible), `templates/site-font-preload.example.ts`, `templates/performance-overrides.example.css` — optional CWV patterns (**adapt per site**)
- `templates/vite-ssr-noexternal.example.ts` — `web/vite.config.ts` shape with the **`ssr.noExternal`** pattern + local SSR smoke test for Netlify function crashes (**per-site list**, do not paste another project's deps)
- `templates/site-seo.example.ts` — `web/src/site/seo.ts` + reminder that **`{ title }` belongs inside `head().meta`**, not top-level `head()`
- `templates/site-fonts.css`, `templates/marketing.css`, `MarketingSiteRoot.tsx` — same ideas as before, paths under `web/src/`

## Rules to scaffold

```bash
mkdir -p .cursor/rules
cp ./rules/*.mdc .cursor/rules/   # from this skill repo root; or use ~/.cursor/skills/webflow-to-react/rules/ if installed globally
```

- `webflow-css-preservation.mdc`, `self-hosted-fonts-vite.mdc`, `gsap-in-react.mdc`, `marketing-global-effects.mdc`, `widget-iframe-overlay.mdc`, `netlify-tanstack-deploy.mdc`, `ssr-noexternal-netlify.mdc`, `performance-cwv.mdc`

## Tech stack (default)

- **TanStack Start** (React) — SSR, TanStack Router file routes
- **Vite** (as bundled by TanStack Start)
- **TypeScript 5.9+**
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **shadcn/ui** (`base-nova`) where components are needed
- **GSAP** — keep from export; **client-only** initialization (see gotchas § SSR)
- **Analytics** — match the export and user choice (Plausible, Fathom, none, etc.; do not assume Plausible)
- **Netlify** — `@netlify/vite-plugin-tanstack-start` + `netlify.toml` (see templates)

**Legacy opt-out:** If the user explicitly wants a **plain Vite SPA** (no SSR), follow the older Vite-only paths still described in playbook appendix; do not force TanStack Start against their wishes.

## What this skill will not do

- Rewrite GSAP in Framer Motion wholesale.
- Run a full CMS migration from Webflow CMS (stop and ask).
- Rebuild Webflow Interactions 2.0 keyframe-for-keyframe (re-implement only what matters).
- Store Netlify/GitHub **secrets** in-repo or bypass OAuth with embedded tokens.

## Hand-off

Read **[playbook.md](playbook.md)** next, then **[shipping.md](shipping.md)** before any “push to GitHub / deploy” step.

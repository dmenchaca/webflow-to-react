# First-run ship: GitHub + Netlify

Run this **once per new Webflow → code migration** after the app builds locally (`npm run build` in `web/`). Goal: **private GitHub repo** + **Netlify site** wired to that repo.

Agents should follow this doc whenever the user asks to “ship”, “push to GitHub”, or “deploy to Netlify” for a **first-time** conversion.

---

## Prerequisites (agent checklist)

1. **Local build passes** in `web/` (`npm run build` or `pnpm build`).
2. **Git** initialized at repo root, `.gitignore` excludes `node_modules/`, `dist/`, `.env*`.
3. User has **named the repo** (kebab-case, e.g. `acme-marketing-webflow`).

---

## 1. GitHub — create repo and push

### 1.1 Prefer MCP (Cursor GitHub integration)

If the **GitHub MCP** server is enabled and tools like `create_repository` / `push_files` are available:

1. Call **`get_me`** (or equivalent) to confirm the authenticated GitHub user. If it fails or returns unauthenticated → go to **§1.3 Auth fallback**.
2. Call **`create_repository`** with:
   - `name`: agreed repo name  
   - `private`: `true` (unless the user asked for public)  
   - `autoInit`: `false` (we already have commits locally)  
3. Add remote and push from the shell:
   ```bash
   git remote add origin https://github.com/<user>/<repo>.git
   git branch -M main
   git push -u origin main
   ```
   Use the **exact** `clone_url` / SSH URL from the `create_repository` response if provided.

If **`push_files`** is used instead of `git push`, follow that tool’s schema (batch file limits, encoding). Prefer normal `git push` for large binaries (images/fonts).

### 1.3 Auth fallback — user not signed in to GitHub in Cursor

Do **not** stall the run silently. In order:

1. **Tell the user** Cursor needs GitHub access for MCP: **Settings → MCP → GitHub** (or the GitHub provider) → sign in / reconnect.
2. **CLI fallback:** if `gh` is installed:
   ```bash
   gh auth login
   ```
   Then create the repo:
   ```bash
   gh repo create <org-or-user>/<repo> --private --source=. --remote=origin --push
   ```
3. **Manual fallback:** user creates an **empty private repo** on github.com, then:
   ```bash
   git remote add origin git@github.com:<user>/<repo>.git
   git push -u origin main
   ```

Document the chosen remote URL in the root `README.md` under **Repository**.

---

## 2. Netlify — link site and deploy

There is **no standard Netlify MCP** in the default Cursor bundle; treat Netlify as **CLI + dashboard** unless the user has a custom Netlify MCP.

### 2.1 Recommended path (dashboard)

1. **Netlify** → **Add new site** → **Import an existing project** → **GitHub** → pick the new repo.
2. Prefer **no duplicate settings in the UI**: commit the skill’s root **`netlify.toml`** ([templates/netlify.toml](templates/netlify.toml)) with **`[build] base = "web"`**, **`command`**, and **`publish = "dist/client"`**. Then in **Site configuration → Build & deploy → Build settings**, leave these **empty** so the file wins:
   - **Build command** — empty (never type `netlify.toml` here; that string is treated as a shell command and overrides the file)
   - **Base directory** — empty (the file sets `base = "web"`)
   - **Package directory** — empty unless you use a documented monorepo layout that requires it
   - **Publish directory** — empty (the file sets `publish` relative to `base`)
3. If you **must** fill the UI (e.g. older site without file-based config), align with the file: base **`web`**, build **`npm ci && npm run build`**, publish **`dist/client`** (relative to **`web/`**, not `web/dist/client` from repo root unless base is empty).
4. Deploy. Fix any build errors on Netlify (Node version, env vars).

**UI gotcha:** Some Netlify UIs **mirror** whatever you type in Base directory into Package directory (or force a `web/` prefix on publish). If clearing fields is impossible, rely on **`netlify.toml` at the repo root** and keep UI fields blank after each save when possible.

### 2.2 CLI path

```bash
npm i -g netlify-cli   # or use npx netlify
netlify login          # opens browser — user must complete OAuth
netlify init           # link site to repo, or create new site
```

If `netlify login` fails, use the **dashboard** method in §2.1.

### 2.3 Auth fallback — user not logged into Netlify

1. **Explain** they must complete **Netlify OAuth** once (browser).
2. **`netlify login`** in terminal, or connect GitHub in Netlify UI (no CLI needed for Git-based deploys).
3. Do not commit **Netlify tokens** or **personal access tokens** into the repo.

---

## 3. TanStack Start + Netlify build notes

- Install **`@netlify/vite-plugin-tanstack-start`** as devDependency in `web/` and register it in `vite.config.ts` per [TanStack Start hosting docs](https://tanstack.com/start/latest/docs/framework/react/guide/hosting).
- **Repo-root `netlify.toml` should use `[build] base = "web"`** and **`publish = "dist/client"`** (relative to **`base`**, i.e. **`web/dist/client`** on disk). Do **not** set `publish = "web/dist/client"` in the same file as `base = "web"` — Netlify resolves **`web/web/dist/client`**.
- **Avoid** relying on **`npm ci --prefix web && npm run build --prefix web`** from the repo root **without** `[build] base` in `netlify.toml`. The plugin writes **`.netlify/`** under **`web/`** when the build runs there; a prefix-only build can upload static assets but leave SSR/functions miswired → Netlify’s generic **“Page not found”** on the live URL.
- Always verify local output with:
  ```bash
  (cd web && npm run build && ls -la dist)
  ```
- After deploy, build logs should show the real **`npm ci` / `vite build`**, not a bogus command. See [gotchas.md](gotchas.md) § Netlify for symptoms (404 despite “success”, **0 new functions** when SSR should upload).
- **Local `vite dev`:** add **`web/netlify.toml`** from [templates/web-netlify.toml](templates/web-netlify.toml) so `@netlify/vite-plugin` does not resolve **`web/web`** when `repositoryRoot` is **`web/`** (see gotchas § Netlify).
- **Local SSR smoke test (run before every push):** Vite build success does **not** mean the Netlify function will start. Always run:
  ```bash
  cd web && npm run build && \
    node -e "import('./.netlify/v1/functions/server.mjs').then(() => console.log('SSR import OK')).catch(e => { console.error(e); process.exit(1) })"
  ```
  If you see `Cannot use import statement outside a module` or `ERR_REQUIRE_ESM`, follow [gotchas.md](gotchas.md) § *Netlify SSR function crashes on first request* — copy the package name from the stack trace into **`ssr.noExternal`** in `web/vite.config.ts` (see [templates/vite-ssr-noexternal.example.ts](templates/vite-ssr-noexternal.example.ts)) and rerun. The list is **per-site**; do not paste another project's deps.
- **After deploy, hit the live URL once.** A green Netlify build only validates the bundler step, not the function. The first request is the real test.

---

## 4. Order of operations (summary)

```
Local build OK → git commit → GitHub repo (MCP or gh or manual) → push
→ Netlify import repo → commit root netlify.toml ([build] base = web) → clear UI overrides → deploy → share URL
```

---

## 5. What to tell the user if something is blocked

| Blocker | Action |
|--------|--------|
| GitHub MCP unauthorized | Sign in to GitHub in Cursor; or `gh auth login`; or create repo manually |
| No `gh` CLI | Use GitHub.com “New repository” + `git remote add` + `git push` |
| Netlify not connected | `netlify login` or dashboard import only |
| Wrong publish dir | Run local `npm run build` in `web/` and list `dist/` |
| Build command shows `netlify.toml` or other junk | Clear **Build command** in UI so repo `netlify.toml` applies |
| 404 after “successful” deploy, `0` new functions | Use `[build] base = "web"` in `netlify.toml`; avoid `--prefix`-only builds (see [gotchas.md](gotchas.md) § Netlify) |
| `vite dev` error: Base directory `…/web/web` does not exist | Add **`web/netlify.toml`** from [templates/web-netlify.toml](templates/web-netlify.toml) |
| Netlify function crash: `Cannot use import statement outside a module` / `ERR_REQUIRE_ESM` | Add the package named in the stack trace to **`ssr.noExternal`** in `web/vite.config.ts`; rerun the SSR smoke test ([gotchas.md](gotchas.md) § SSR / [templates/vite-ssr-noexternal.example.ts](templates/vite-ssr-noexternal.example.ts)) |

This file is **normative** for the skill’s “ship on first migration” behavior.

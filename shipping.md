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
2. Set **build** settings to match TanStack Start (see [playbook § Deploy](playbook.md) and root `netlify.toml`):
   - **Base directory:** `web` (if the app lives in `web/`)
   - **Build command:** `npm ci && npm run build` (or `pnpm install --frozen-lockfile && pnpm build`)
   - **Publish directory:** `web/dist/client` (confirm after one local build — TanStack Start + Netlify plugin usually outputs under `dist/client`; adjust if your build prints a different path)
3. Deploy. Fix any build errors on Netlify (Node version, env vars).

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
- **Publish directory** is often `dist/client` **relative to `web/`**; from repo root that is **`web/dist/client`**. Always verify with:
  ```bash
  (cd web && npm run build && ls -la dist)
  ```

---

## 4. Order of operations (summary)

```
Local build OK → git commit → GitHub repo (MCP or gh or manual) → push
→ Netlify import repo → set base/build/publish → deploy → share URL
```

---

## 5. What to tell the user if something is blocked

| Blocker | Action |
|--------|--------|
| GitHub MCP unauthorized | Sign in to GitHub in Cursor; or `gh auth login`; or create repo manually |
| No `gh` CLI | Use GitHub.com “New repository” + `git remote add` + `git push` |
| Netlify not connected | `netlify login` or dashboard import only |
| Wrong publish dir | Run local `npm run build` in `web/` and list `dist/` |

This file is **normative** for the skill’s “ship on first migration” behavior.

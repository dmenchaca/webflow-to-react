<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/rocket_1f680.png" width="96" alt="" />
</p>

<h1 align="center">webflow-to-react</h1>

<p align="center">
  <strong>Webflow export → TanStack Start (React + SSR)</strong><br />
  <em>Playbook, checklists, rules, and templates for pixel-parity migrations</em>
</p>

<p align="center">
  <a href="https://github.com/dmenchaca/webflow-to-react/stargazers"><img src="https://img.shields.io/github/stars/dmenchaca/webflow-to-react?style=flat&color=yellow" alt="Stars" /></a>
  <a href="https://github.com/dmenchaca/webflow-to-react/commits/main"><img src="https://img.shields.io/github/last-commit/dmenchaca/webflow-to-react?style=flat" alt="Last commit" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/dmenchaca/webflow-to-react?style=flat" alt="License" /></a>
</p>

<p align="center">
  <a href="#what-this-is">What this is</a> &nbsp;·&nbsp;
  <a href="#why-migrate-from-webflow-to-react">Why migrate</a> &nbsp;·&nbsp;
  <a href="#whats-in-the-repo">What's in the repo</a> &nbsp;·&nbsp;
  <a href="#installation">Installation</a> &nbsp;·&nbsp;
  <a href="#usage">Usage</a> &nbsp;·&nbsp;
  <a href="#license">License</a>
</p>

---

## What this is

An [agent skill](https://agentskills.io/) for turning a **Webflow HTML export** into a **TanStack Start** app: keep CSS and layout honest, keep GSAP, ship SSR + Netlify without inventing a second stack. The workflow lives in Markdown so **Cursor, Claude Code, Copilot, Gemini CLI, Codex**, and friends can follow the same playbook.

## Why migrate from Webflow to React

- **Lower hosting cost:** Deploy to [Netlify](https://www.netlify.com/), [Cloudflare](https://pages.cloudflare.com/), or [Vercel](https://vercel.com/). For a typical site, their free tiers are often enough, so you are not paying Webflow to host a static or SSR marketing site.
- **Agentic editing:** Use Cursor, Claude, Antigravity or your agent of choice to edit your site.
- **Skills ecosystem:** Stack this skill with others like [Impeccable](https://impeccable.style/) for design polish and critique, and [Motion](https://motion.dev/) (or your Motion / animation skill of choice) to refine motion and interactions.

## What's in the repo

| Item | What |
|------|------|
| [SKILL.md](SKILL.md) | When to use it, end-to-end checklist, where things live |
| [playbook.md](playbook.md) | Bootstrap order, app layout, CSS strategy |
| [gotchas.md](gotchas.md) | Fonts, SSR vs client, Netlify, GSAP, meta |
| [shipping.md](shipping.md) | First-run GitHub + Netlify |
| [checklists/](checklists/) | Pre-migration + before “done” |
| [rules/](rules/) | Portable rules (optional copy into `.cursor/rules/`, etc.) |
| [templates/](templates/) | Snippets and examples |

## Installation

**Recommended** — from your project (or any folder):

```bash
npx skills@latest add dmenchaca/webflow-to-react -y
```

Install for all projects on this machine: add `-g`. Reload your editor or agent after install.

**Or** clone the repo into your tool's skills directory (global or project). Paths differ by product; [SKILL.md](SKILL.md) calls out common layouts and Copilot-style setups.

## Usage

1. Open **[SKILL.md](SKILL.md)**, then **[playbook.md](playbook.md)** when you start a migration.  
2. Use **[shipping.md](shipping.md)** before first deploy, **[gotchas.md](gotchas.md)** when something looks wrong.  
3. In the IDE, **@-mention** the skill or `SKILL.md` if your product supports it.

## Supported tools

- [Cursor](https://cursor.com)
- [Claude Code](https://claude.ai/code)
- [GitHub Copilot](https://code.visualstudio.com/docs/copilot)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Codex CLI](https://developers.openai.com/codex/)
- …and other agents that load [`SKILL.md`](SKILL.md) as a skill (see the [skills](https://github.com/vercel-labs/skills) CLI).

## License

[MIT](LICENSE).

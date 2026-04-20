# webflow-to-react (agent skill)

**Webflow HTML export → TanStack Start (React + SSR)** — playbook, checklists, portable rules, and templates for pixel-parity migrations. Use with **Cursor, Claude Code, GitHub Copilot, Gemini, Codex**, or any assistant that reads Markdown skills and project instructions.

## Install

Clone or copy this repo wherever your tool loads skills or long-lived instructions (check that product’s docs for the exact path).

### Examples

| Tool | Typical location |
|------|------------------|
| **Cursor** | `~/.cursor/skills/webflow-to-react` or project `.cursor/skills/` |
| **Claude Code / Claude** | `~/.claude/skills/webflow-to-react` (or project-local skills per docs) |
| **Others** | Project `AGENTS.md`, `.github/copilot-instructions.md`, or vendor-specific skill folders |

**Cursor — clone:**

```bash
git clone git@github.com:dmenchaca/webflow-to-react.git ~/.cursor/skills/webflow-to-react
```

Restart the IDE or start a new session. Load `SKILL.md` via `@` mention or by asking to migrate a Webflow export.

**Single project copy:**

```bash
mkdir -p .cursor/skills
cp -R /path/to/webflow-to-react .cursor/skills/
```

### Rules (recommended)

`rules/*.mdc` are Markdown rules (fonts, CSS, GSAP, Netlify, CWV). **Cursor:** copy into `.cursor/rules/`. **Other agents:** merge the same content into your project’s agent-instructions file so every tool enforces the same constraints.

```bash
mkdir -p .cursor/rules
cp ./rules/*.mdc .cursor/rules/   # from repo root; Cursor
```

## Contents

| Path | Purpose |
|------|---------|
| `SKILL.md` | Entry point — workflow, stack, when to use, multi-agent notes |
| `playbook.md` | Bootstrap order, TanStack layout, deploy |
| `gotchas.md` | Fonts, SSR, GSAP, widgets, head/meta |
| `shipping.md` | First-run GitHub + Netlify |
| `checklists/` | Pre-migration + cleanup ship gate |
| `rules/` | Portable rules (fonts, CSS, GSAP, widgets, Netlify) |
| `templates/` | Snippets (netlify, fonts barrel, `MarketingSiteRoot`, …) |

## License

Private repository — share only with collaborators you invite on GitHub.

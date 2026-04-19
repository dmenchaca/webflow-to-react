# webflow-to-react (Cursor agent skill)

**Webflow HTML export → TanStack Start (React + SSR)** — playbook, checklists, Cursor rules, and templates for pixel-parity migrations.

## Use in Cursor

### Option A — clone into your machine

```bash
git clone git@github.com:dmenchaca/webflow-to-react.git ~/.cursor/skills/webflow-to-react
```

Restart Cursor or start a new chat. The agent can read `SKILL.md` when you `@`-mention it or ask to migrate a Webflow export.

### Option B — copy into a single project

```bash
mkdir -p .cursor/skills
cp -R /path/to/clone/webflow-to-react .cursor/skills/
```

### Rules (recommended)

Copy the `.mdc` rules into the project you are migrating:

```bash
mkdir -p .cursor/rules
cp ./rules/*.mdc .cursor/rules/   # from repo root after clone
```

## Contents

| Path | Purpose |
|------|---------|
| `SKILL.md` | Entry point — workflow, stack, when to use |
| `playbook.md` | Bootstrap order, TanStack layout, deploy |
| `gotchas.md` | Fonts, SSR, GSAP, widgets, head/meta |
| `shipping.md` | First-run GitHub + Netlify |
| `checklists/` | Pre-migration + cleanup ship gate |
| `rules/` | Cursor rules (fonts, CSS, GSAP, widgets) |
| `templates/` | Snippets (netlify, fonts barrel, `MarketingSiteRoot`, …) |

## License

Private repository — share only with collaborators you invite on GitHub.

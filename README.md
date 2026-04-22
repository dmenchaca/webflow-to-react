# webflow-to-react (agent skill)

**Webflow HTML export → TanStack Start (React + SSR)** — playbook, checklists, portable rules, and templates for pixel-parity migrations.

This repo is a single [Agent Skills](https://agentskills.io/)-style package: a directory with **`SKILL.md`** at the root plus linked Markdown, `rules/`, and `templates/`. Install it where your tool discovers skills, or point Copilot-style assistants at the files via project instructions.

**Default clone URL (replace with your fork if needed):**

- SSH: `git@github.com:dmenchaca/webflow-to-react.git`
- HTTPS: `https://github.com/dmenchaca/webflow-to-react.git`

---

## Installation

### Recommended: `npx skills` (one command)

From a project root (or anywhere), install with the [skills](https://www.npmjs.com/package/skills) CLI — same flow as other skills on [skills.sh](https://skills.sh/):

```bash
npx skills@latest add dmenchaca/webflow-to-react -y
```

- **Project-local** (default): writes `.agents/skills/webflow-to-react/` and symlinks for supported agents (Cursor, Claude Code, Codex, Gemini CLI, etc.).
- **Global (one copy per user):** add `-g`:
  ```bash
  npx skills@latest add dmenchaca/webflow-to-react -g -y
  ```
- **Pick agents explicitly:** e.g. `npx skills@latest add dmenchaca/webflow-to-react --agent cursor claude-code -y`
- **Non-interactive everything:** `npx skills@latest add dmenchaca/webflow-to-react --all` (installs all skills in the repo with all agents, with prompts skipped)

After install, **reload the IDE or agent** so the skill is picked up. Run `npx skills@latest list` (or `list -g`) to confirm.

---

### Alternative: `git clone` (global, one copy per machine)

Pick **one** block for the tool you use. Each command installs the skill under that tool’s global skills directory so every project can use it.

#### Cursor

```bash
git clone git@github.com:dmenchaca/webflow-to-react.git ~/.cursor/skills/webflow-to-react
```

**Notes**

- Resulting layout: `~/.cursor/skills/webflow-to-react/SKILL.md` (and the rest of this repo).
- Enable **Agent Skills** in Cursor and use the product docs if skills do not appear: [Cursor · Agent Skills](https://cursor.com/docs/context/skills).

#### Claude Code

```bash
git clone git@github.com:dmenchaca/webflow-to-react.git ~/.claude/skills/webflow-to-react
```

**Notes**

- Personal skills live under `~/.claude/skills/<skill-name>/SKILL.md`. See [Extend Claude with skills](https://docs.anthropic.com/en/docs/claude-code/skills).

#### Gemini CLI

```bash
gemini skills install https://github.com/dmenchaca/webflow-to-react.git
```

Or clone manually into the user skills tier:

```bash
git clone https://github.com/dmenchaca/webflow-to-react.git ~/.gemini/skills/webflow-to-react
```

**Notes**

- Workspace-local alternative: `.gemini/skills/` (or `.agents/skills/`) in the project. See [Gemini CLI · Agent Skills](https://geminicli.com/docs/cli/skills/).
- Verify with `gemini skills list` or `/skills list` in an interactive session.

#### Codex CLI (OpenAI)

```bash
git clone https://github.com/dmenchaca/webflow-to-react.git ~/.agents/skills/webflow-to-react
```

**Notes**

- Codex reads user skills from `$HOME/.agents/skills`. See [Codex · Agent Skills](https://developers.openai.com/codex/skills).
- If the skill does not show up, restart Codex after install.

#### GitHub Copilot in VS Code (and similar)

Copilot does not use the same global “skills folder” layout. Use **always-on instructions** that tell the agent to follow this workflow:

1. **Add this repo to the workspace** (clone, submodule, or multi-root workspace) so `SKILL.md` and `playbook.md` are readable in chat, **or**
2. **Add a short pointer** in [`.github/copilot-instructions.md`](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) or root **`AGENTS.md`** (e.g. “For Webflow → TanStack migrations, read `SKILL.md` and `gotchas.md` in this repo” or give a relative path such as `docs/webflow-to-react/`).

**Notes**

- [Use custom instructions in VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) — `.github/copilot-instructions.md` and `AGENTS.md` are supported.

---

### Project-local (commit or copy into one repo)

Use this when the skill should only apply to a single project (team shares it via Git).


| Tool        | Path (inside your app repo)                                              |
| ----------- | ------------------------------------------------------------------------ |
| Cursor      | `.cursor/skills/webflow-to-react/`                                       |
| Claude Code | `.claude/skills/webflow-to-react/`                                       |
| Gemini CLI  | `.gemini/skills/webflow-to-react/` or `.agents/skills/webflow-to-react/` |
| Codex CLI   | `.agents/skills/webflow-to-react/` (at or above where you run Codex)     |


**Example (Claude Code layout):**

```bash
mkdir -p .claude/skills
git clone git@github.com:dmenchaca/webflow-to-react.git .claude/skills/webflow-to-react
# or: cp -R /path/to/webflow-to-react .claude/skills/webflow-to-react
```

### Rules (recommended for Cursor and parity elsewhere)

The `rules/*.mdc` files are Markdown rules (fonts, CSS, GSAP, Netlify, CWV).

**Cursor:** copy into the project’s rules directory so the agent enforces them on every turn:

```bash
mkdir -p .cursor/rules
cp ./rules/*.mdc .cursor/rules/   # run from the webflow-to-react repo root, or adjust path
```

**Other tools:** merge the same constraints into `AGENTS.md`, `.github/copilot-instructions.md`, or your vendor’s rules file (see `SKILL.md` → *Coding agents and IDEs*).

---

## Usage

- **Implicit:** The YAML **`description`** in `SKILL.md` is written so agents match on phrases like *Webflow export*, *TanStack Start*, *convert Webflow to React*, *SSR*, and *pixel parity*. Ordinary prompts in that vein should pull the skill in where the tool supports skill discovery.
- **Explicit / attachments:** In IDEs that support it, **@-mention** `SKILL.md` (or the `webflow-to-react` skill) in chat to load it. In **Claude Code**, invoke by skill name (see [skills docs](https://docs.anthropic.com/en/docs/claude-code/skills)). In **Codex**, use **`/skills`** or **`$`** skill mentions per [Codex skills](https://developers.openai.com/codex/skills).
- **Rules:** After copying `rules/*.mdc` into `.cursor/rules/`, those rules apply automatically in Cursor. For Copilot, mirror the same constraints in project instructions.
- **First run:** Open **`SKILL.md`**, then **`playbook.md`**, then **`shipping.md`** before any deploy step.

---

## Contents


| Path          | Purpose                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `SKILL.md`    | Entry point — workflow, stack, when to use, multi-agent notes                                          |
| `playbook.md` | Bootstrap order, TanStack layout, deploy                                                               |
| `gotchas.md`  | Fonts, SSR, GSAP, widgets, head/meta                                                                   |
| `shipping.md` | First-run GitHub + Netlify                                                                             |
| `checklists/` | Pre-migration + cleanup ship gate                                                                      |
| `rules/`      | Portable rules (fonts, CSS, GSAP, widgets, Netlify)                                                    |
| `templates/`  | Snippets (netlify, fonts barrel, `MarketingSiteRoot`, static `sitemap.xml` / `robots.txt` examples, …) |
| `LICENSE`     | [MIT](LICENSE)                                                                                         |


---

## Supported tools

Skills layout varies by product; this repo follows the common `SKILL.md`-at-root pattern.

- [Cursor](https://cursor.com) — global `~/.cursor/skills/`
- [Claude Code](https://claude.ai/code) — `~/.claude/skills/` or project `.claude/skills/`
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — `~/.gemini/skills/` or `.gemini/skills/`
- [Codex CLI](https://developers.openai.com/codex/) — `~/.agents/skills/` or repo `.agents/skills/`
- [GitHub Copilot in VS Code](https://code.visualstudio.com/docs/copilot) — via `AGENTS.md` / `.github/copilot-instructions.md` + workspace files

---

## License

[MIT](LICENSE) — see the [`LICENSE`](LICENSE) file for full text.

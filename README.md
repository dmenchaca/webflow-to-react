# webflow-to-react

[License: MIT](LICENSE)
[GitHub stars](https://github.com/dmenchaca/webflow-to-react/stargazers)
[Last commit](https://github.com/dmenchaca/webflow-to-react/commits/main)

An [agent skill](https://agentskills.io/) for turning a **Webflow HTML export** into a **React app** using TanStack Start and Netlify for hosting. 

This skill keeps CSS and layout intact to ensure a pixel perfect conversion. 

Webflow CMS template pages are converted but the skill **does not handle CMS**. To switch out of Webflow CMS you will need a headless CMS like Sanity, Astro, etc.

## Quick Start

1. **Export site from Webflow**
  Go to Webflow and export site. You will get .zip file.
2. **Install skill**
  ```markdown
   npx skills@latest add dmenchaca/webflow-to-react -y
  ```
   Install for all projects on this machine: add `-g`. Reload your editor or agent after install.
3. **Upload exported .zip Cursor, Claude or your agent of choice**
  ```markdown
   Convert this Webflow export to TanStack Start (React, SSR) with pixel parity. Use the webflow-to-re
  act skill and follow SKILL.md from step one.
  ```

## Deploying site

The skill is optimized for Netlify and supports server-side rendering (SSR) out of the box. 
To deploy simply push your site to Github and connect Github with Netlify.

## Troubeshooting

If you run into issues with the deploy or SSR run this prompt:

```markdown
Work through checklists/cleanup-before-done.md and gotchas.md for CWV, sitemap.xml / robots.txt if we need them, and any Netlify function / ssr.noExternal issues.
```

## Supported tools

- [Cursor](https://cursor.com)
- [Claude Code](https://claude.ai/code)
- [GitHub Copilot](https://code.visualstudio.com/docs/copilot)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Codex CLI](https://developers.openai.com/codex/)
- …and other agents that load `[SKILL.md](SKILL.md)` as a skill (see the [skills](https://github.com/vercel-labs/skills) CLI).

## License

[MIT](LICENSE).
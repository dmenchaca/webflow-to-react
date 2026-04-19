// web/vite.config.ts — SSR `noExternal` pattern (TanStack Start + Netlify)
//
// PURPOSE
// Prevent Netlify SSR function crashes of the form:
//   - "SyntaxError: Cannot use import statement outside a module"
//   - "Error [ERR_REQUIRE_ESM]: require() of ES Module …"
// These are runtime-only failures: `npm run build` and `vite dev` do not catch
// them. They surface on the FIRST real request to the deployed function.
//
// HOW IT WORKS
// `ssr.noExternal` tells Vite to INLINE the listed packages into the SSR
// bundle (`dist/server/assets/routes-*.js`) instead of leaving them as raw
// `node_modules/<pkg>/...` files in the Netlify function. Once inlined, the
// production Node loader never has to decide whether a given file is ESM or
// CJS, so the mismatch goes away.
//
// HOW TO POPULATE THE LIST FOR A SPECIFIC SITE
// Do NOT copy a fixed list verbatim. Each Webflow export ships different
// dependencies. Instead:
//   1. Deploy. If the function page shows `Cannot use import statement
//      outside a module` or `ERR_REQUIRE_ESM`, the stack trace will name a
//      file under `/var/task/node_modules/<pkg>/...`. Add `<pkg>` here.
//   2. Run the local SSR smoke test (see comment at the bottom of this file).
//   3. Repeat — these errors typically unmask one package at a time.
//
// WHEN NOT TO USE THIS
// If the offending package is BROWSER-ONLY (e.g. a Rive/canvas runtime,
// `localStorage` wrappers, anything that touches `window`), the right fix is
// to dynamic-import it inside a `useEffect` so the server never imports it,
// not to inline it into the SSR bundle.

import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },

  ssr: {
    noExternal: [
      // Append packages named in the Netlify function stack trace, e.g.:
      //   'gsap',
      //   'html-react-parser',
      //   'html-dom-parser',
      //   'domhandler',
      // Leave EMPTY for sites that never trigger the crash. The list is
      // additive and per-site; do not paste another project's config here.
    ],
  },

  plugins: [devtools(), tailwindcss(), tanstackStart(), netlify(), viteReact()],
})

// LOCAL SSR SMOKE TEST (run after every change to this list):
//   cd web && npm run build && \
//     node -e "import('./.netlify/v1/functions/server.mjs').then(() => \
//       console.log('SSR import OK')).catch(e => { console.error(e); \
//       process.exit(1) })"
//
// If this prints `SSR import OK`, the same module graph will at least start
// on Netlify. If it throws `Cannot use import statement outside a module` or
// `ERR_REQUIRE_ESM`, copy the package name from the stack trace into the
// `noExternal` array above and rerun.

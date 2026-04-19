/**
 * Example: derive `<link rel="preload" as="font">` entries from your actual
 * `web/src/styles/site-fonts.css` @font-face `src` URLs — only preload weights
 * used above the fold (hero / nav) to avoid wasting bandwidth on every page.
 *
 * Merge into createRootRoute({ head: () => ({ links: [...] }) }) before the main stylesheet.
 *
 * Example link shape (TanStack Router head):
 *   { rel: 'preload', href: '/fonts/YourFont-Regular.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
 */

export function exampleFontPreloadLinks() {
  return [
    {
      rel: 'preload' as const,
      href: '/fonts/REPLACE-with-file-from-export.woff2',
      as: 'font' as const,
      type: 'font/woff2',
      crossOrigin: 'anonymous' as const,
    },
  ]
}

// web/src/site/seo.ts — copy values from the Webflow export's index.html <head>.
// Wire into createRootRoute({ head: () => ({ meta: [...], links: [...] }) }).
//
// IMPORTANT (TanStack Router): `<title>` must appear INSIDE the `meta` array as
// `{ title: siteSeo.title }` — a top-level `title` key on the object returned by
// `head()` is ignored. Place `{ title: … }` last in `meta` if child routes might
// override other tags.

export const siteSeo = {
  title: 'Page title from export <title>',
  description: 'Meta description from export',
  ogTitle: 'Open Graph title',
  ogDescription: 'Open Graph description',
  /** Absolute URL — use production domain or Webflow CDN URL from export */
  ogImage: 'https://example.com/og-image.png',
  twitterCard: 'summary_large_image' as const,
  themeColor: '#000000',
  /** Only if the site uses Plausible — else omit script from head() */
  plausibleDomain: 'example.com',
}

/**
 * Example: deferred **Plausible** loader — use **only** when this migration chose Plausible.
 * Many Webflow exports use GTM, GA, other pixels, or no analytics; do not add this by default.
 *
 * - Set VITE_PLAUSIBLE_DOMAIN in web/.env (apex host, no protocol).
 * - Mount <PlausibleLoader /> once in the root shell (e.g. __root.tsx body), not a blocking
 *   <script> in <head> — reduces PageSpeed “forced reflow” attribution.
 *
 * For Fathom / other small scripts, adapt the same inject-after-idle pattern with their URL.
 */
import { useEffect } from 'react'

const PLAUSIBLE_SRC = 'https://plausible.io/js/script.js'

export function PlausibleLoader() {
  useEffect(() => {
    const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
    if (!domain || !import.meta.env.PROD) return

    const inject = () => {
      if (document.querySelector(`script[src="${PLAUSIBLE_SRC}"]`)) return
      const s = document.createElement('script')
      s.defer = true
      s.dataset.domain = domain
      s.src = PLAUSIBLE_SRC
      document.head.appendChild(s)
    }

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => inject(), { timeout: 4000 })
      } else {
        setTimeout(inject, 0)
      }
    }

    if (document.readyState === 'complete') {
      schedule()
      return
    }

    const onLoad = () => schedule()
    window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}

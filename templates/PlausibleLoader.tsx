/**
 * Deferred analytics loader (Plausible). Generic pattern for any site:
 * - Set VITE_PLAUSIBLE_DOMAIN in web/.env (e.g. your apex domain, no protocol).
 * - Mount <PlausibleLoader /> once in the root shell (e.g. __root.tsx body), not a
 *   blocking <script> in <head> — reduces PageSpeed “forced reflow” from third-party JS.
 *
 * For Fathom / other lightweight scripts, adapt the same pattern (inject after load + idle).
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

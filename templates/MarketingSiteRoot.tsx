import { useRef } from 'react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useRelumeTooltips } from '@/hooks/useRelumeTooltips'
import { useRiveAnimations } from '@/hooks/useRiveAnimations'
import { useTestimonialIframeResize } from '@/hooks/useTestimonialIframeResize'
import { useTouchClass } from '@/hooks/useTouchClass'

type Props = {
  children: React.ReactNode
}

/**
 * Wraps the marketing page and wires up global side effects.
 * Each hook is idempotent and cleans up on unmount. Add/remove
 * hooks here, not in individual sections.
 */
export function MarketingSiteRoot({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useTouchClass()
  useKeyboardShortcuts(containerRef)
  useTestimonialIframeResize()
  useRelumeTooltips()
  useRiveAnimations(containerRef)

  return (
    <div ref={containerRef} id="marketing-site-root" className="contents">
      {children}
    </div>
  )
}

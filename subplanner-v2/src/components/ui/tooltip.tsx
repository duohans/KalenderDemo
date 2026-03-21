import type { ReactNode } from 'react'

import { Button, OverlayArrow, Tooltip, TooltipTrigger } from 'react-aria-components'
import { Info } from 'lucide-react'

import { cn } from '@/lib/cn'

interface InfoTooltipProps {
  label: string
  children: ReactNode
  className?: string
}

export function InfoTooltip({ label, children, className }: InfoTooltipProps) {
  return (
    <TooltipTrigger delay={250}>
      <Button
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-200/80 bg-white/80 text-stone-500 transition hover:border-stone-300 hover:text-stone-700',
          className,
        )}
      >
        <Info className="h-4 w-4" />
      </Button>
      <Tooltip
        offset={10}
        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-[0_16px_42px_-24px_rgba(56,42,28,0.5)]"
      >
        <OverlayArrow>
          <svg width={10} height={10} viewBox="0 0 10 10" className="fill-white stroke-stone-200">
            <path d="M0 0 L5 5 L10 0" />
          </svg>
        </OverlayArrow>
        {children}
      </Tooltip>
    </TooltipTrigger>
  )
}

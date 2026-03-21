import type { ReactNode } from 'react'

import { PanelSurface } from '@/components/ui/panel'
import { InfoTooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/cn'

interface ToolPanelProps {
  title: string
  subtitle: string
  tooltip: string
  children: ReactNode
  className?: string
  footer?: ReactNode
  testId?: string
}

export function ToolPanel({
  title,
  subtitle,
  tooltip,
  children,
  className,
  footer,
  testId,
}: ToolPanelProps) {
  return (
    <PanelSurface
      data-testid={testId}
      className={cn('flex h-full flex-col overflow-hidden p-4 sm:p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-micro text-stone-500">{title}</p>
          <h2 className="mt-1 font-display text-[1.6rem] leading-none text-ink-800">{title}</h2>
          <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
        </div>
        <InfoTooltip label={`${title} info`}>{tooltip}</InfoTooltip>
      </div>

      <div className="mt-5 flex flex-1 flex-col gap-3">{children}</div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </PanelSurface>
  )
}

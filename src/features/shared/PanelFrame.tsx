import { CircleHelp } from 'lucide-react'
import type { PropsWithChildren } from 'react'

import { cx } from '../../lib/cx.ts'

type PanelFrameProps = PropsWithChildren<{
  title: string
  subtitle?: string
  tooltip?: string
  ariaLabel?: string
  showHeader?: boolean
  className?: string
}>

export function PanelFrame({
  title,
  subtitle,
  tooltip,
  ariaLabel,
  showHeader = true,
  className,
  children,
}: PanelFrameProps) {
  return (
    <section
      className={cx(
        'planner-panel flex h-full min-h-0 flex-col',
        !showHeader && 'planner-panel--headerless',
        className,
      )}
      aria-label={ariaLabel ?? title}
    >
      {showHeader ? (
        <header className="planner-panel__header">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="panel-kicker">{title}</p>
              <h2 className="planner-heading planner-panel__title">{title}</h2>
              {subtitle ? (
                <p className="planner-panel__subtitle">{subtitle}</p>
              ) : null}
            </div>
            {tooltip ? (
              <span
                className="panel-info"
                title={tooltip}
                aria-label={tooltip}
                tabIndex={0}
              >
                <CircleHelp size={14} strokeWidth={2.2} />
              </span>
            ) : null}
          </div>
        </header>
      ) : null}
      <div className="planner-panel__body">{children}</div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { CircleHelp } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

import { cx } from '../../lib/cx.ts'

type PanelFrameProps = PropsWithChildren<{
  title: string
  subtitle?: string
  tooltip?: string
  kicker?: string | null
  tone?: 'neutral' | 'muted' | 'primary' | 'secondary'
  headerStyle?: 'solid' | 'split'
  meta?: ReactNode
  className?: string
}>

export function PanelFrame({
  title,
  subtitle,
  tooltip,
  kicker = null,
  tone = 'neutral',
  headerStyle = 'split',
  meta,
  className,
  children,
}: PanelFrameProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cx(
        'planner-panel flex h-full min-h-[0] flex-col',
        `planner-panel--${tone}`,
        `planner-panel--${headerStyle}`,
        className,
      )}
    >
      <header className="planner-panel__header">
        {kicker ? <p className="panel-kicker">{kicker}</p> : null}
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="planner-heading text-[1.18rem] leading-none">{title}</h2>
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
            {subtitle ? (
              <p className="mt-1.5 text-[0.82rem] leading-snug text-[color:var(--foreground-soft)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {meta ?? <span aria-hidden="true" className="panel-mark" />}
        </div>
      </header>
      <div className="planner-panel__body">{children}</div>
    </motion.section>
  )
}

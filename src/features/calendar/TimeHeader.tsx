import { Clock3 } from 'lucide-react'
import type { TimeBlock } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'

type TimeHeaderProps = {
  block: TimeBlock
  orientation?: 'top' | 'axis'
}

export function TimeHeader({ block, orientation = 'top' }: TimeHeaderProps) {
  return (
    <div
      className={cx(
        'time-header-cell',
        orientation === 'axis' && 'time-header-cell--axis',
      )}
    >
      <span className="time-header-cell__icon" aria-hidden="true">
        <Clock3 size={14} strokeWidth={2.25} />
      </span>
      <span className="time-header-cell__start">{block.start}</span>
      <span className="time-header-cell__end">
        {orientation === 'axis' ? block.end : `til ${block.end}`}
      </span>
    </div>
  )
}

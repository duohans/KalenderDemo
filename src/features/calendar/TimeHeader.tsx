import { Clock3 } from 'lucide-react'
import type { TimeBlock } from '../../domain/schedule/types.ts'

type TimeHeaderProps = {
  block: TimeBlock
}

export function TimeHeader({ block }: TimeHeaderProps) {
  return (
    <div className="time-header-cell">
      <span className="time-header-cell__icon" aria-hidden="true">
        <Clock3 size={14} strokeWidth={2.25} />
      </span>
      <span className="time-header-cell__start">{block.start}</span>
      <span className="time-header-cell__end">til {block.end}</span>
    </div>
  )
}

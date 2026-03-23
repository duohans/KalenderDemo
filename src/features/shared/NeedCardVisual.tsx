import type { CSSProperties, ReactNode } from 'react'
import { GripVertical } from 'lucide-react'

import type { NeedCardDisplayModel } from '../../domain/schedule/selectors.ts'
import type { NeedCard } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'

type NeedCardVisualProps = {
  card: NeedCard
  displayModel: NeedCardDisplayModel | null
  markerSlot: ReactNode
  variant?: 'grid' | 'panel' | 'overlay' | 'detail'
  className?: string
  style?: CSSProperties
}

export function NeedCardVisual({
  card,
  displayModel,
  markerSlot,
  variant = 'grid',
  className,
  style,
}: NeedCardVisualProps) {
  const assignmentMode = displayModel?.assignmentMode ?? 'unassigned'
  const hasConflict = displayModel?.hasConflict ?? true
  const teacher = displayModel?.teacher
  const roomLabel = card.subtitle.trim() || 'Rom ikke satt'
  const showAllocatedTime =
    card.placement === 'unscheduled' &&
    (variant === 'panel' || variant === 'overlay' || variant === 'detail')

  return (
    <article
      className={cx(
        'need-card',
        variant === 'grid' && 'need-card--grid',
        variant === 'panel' && 'need-card--panel',
        variant === 'overlay' && 'need-card--overlay',
        card.placement === 'scheduled' ? 'need-card--scheduled' : 'need-card--unscheduled',
        `need-card--${assignmentMode}`,
        hasConflict && 'need-card--conflict',
        className,
      )}
      style={
        {
          ['--teacher-accent' as string]: displayModel?.teacherAccent ?? card.accentColor,
          ['--row-accent' as string]: displayModel?.rowAccent ?? '#d1d5db',
          ['--assignee-accent' as string]:
            displayModel?.assigneeAccent ?? displayModel?.rowAccent ?? '#d1d5db',
          ...style,
        } as CSSProperties
      }
    >
      <span aria-hidden="true" className="need-card__band" />
      <div className="need-card__head">
        <div className="need-card__teacher-mark" title={teacher?.name ?? 'Ukjent lærer'}>
          <span
            className="need-card__teacher-avatar"
            style={{ backgroundColor: displayModel?.teacherAccent ?? card.accentColor }}
          >
            {teacher?.avatarInitials ?? '??'}
          </span>
          <span className="need-card__teacher-name">
            {teacher?.name ?? 'Ukjent lærer'}
          </span>
        </div>
        <span aria-hidden="true" className="need-card__drag-hint">
          <GripVertical size={15} strokeWidth={2.15} />
        </span>
      </div>
      <div className="need-card__body">
        <p className="need-card__class">{displayModel?.classLabel ?? card.title}</p>
        <h3 className="need-card__subject" title={displayModel?.subjectLabel ?? card.title}>
          {displayModel?.subjectLabel ?? card.title}
        </h3>
        {showAllocatedTime ? (
          <p className="need-card__time" title={displayModel?.allocatedTimeLabel}>
            {displayModel?.allocatedTimeLabel ?? 'Uten tidspunkt'}
          </p>
        ) : null}
        <p className="need-card__room" title={roomLabel}>
          {roomLabel}
        </p>
      </div>
      <div className="need-card__footer">
        <div className="need-card__footer-surface">
          {markerSlot}
        </div>
      </div>
    </article>
  )
}

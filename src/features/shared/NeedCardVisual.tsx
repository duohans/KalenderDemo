import type { CSSProperties, ReactNode } from 'react'

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

  return (
    <article
      className={cx(
        'need-card',
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
          <span className="sr-only">{teacher?.name ?? 'Ukjent lærer'}</span>
        </div>
        {markerSlot}
      </div>
      <div className="need-card__body">
        <p className="need-card__class">{displayModel?.classLabel ?? card.title}</p>
        <h3 className="need-card__subject" title={displayModel?.subjectLabel ?? card.title}>
          {displayModel?.subjectLabel ?? card.title}
        </h3>
      </div>
    </article>
  )
}

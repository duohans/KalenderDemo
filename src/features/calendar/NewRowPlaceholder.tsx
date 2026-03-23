import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'

import { canDropOnTarget, type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { WeekdayId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import { useScheduleDispatch, useScheduleState } from '../schedule/useSchedule.ts'

type NewRowPlaceholderProps = {
  activeDrag: PlannerDragItem | null
  dayId: WeekdayId
  variant?: 'lane' | 'header'
}

export function NewRowPlaceholder({
  activeDrag,
  dayId,
  variant = 'lane',
}: NewRowPlaceholderProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const dispatch = useScheduleDispatch()
  const { pushMotionEvent } = usePlannerDragFeedback()
  const { isOver, setNodeRef } = useDroppable({
    id: 'new-row-placeholder',
    data: {
      type: 'new-row-placeholder',
      dayId,
    },
  })

  const canAcceptNeedCard =
    activeDrag?.type === 'need-card' &&
    canDropOnTarget(state, activeDrag, { type: 'new-row-placeholder', dayId })
  const isActiveDropTarget = Boolean(canAcceptNeedCard && isOver)
  const isHeader = variant === 'header'
  const title = isActiveDropTarget
    ? isHeader
      ? 'Slipp'
      : 'Slipp for ny rad'
    : isHeader
      ? 'Ny rad'
      : 'Ny rad'
  const copy = isActiveDropTarget
    ? isHeader
      ? 'Opprett rad'
      : 'Kortet oppretter en ny rad på sitt faste tidspunkt.'
    : isHeader
      ? 'Tom rad'
      : 'Opprett en tom rad, eller slipp et kort her for å opprette og plassere det.'

  return (
    <div
      ref={setNodeRef}
      data-testid="new-row-placeholder"
      className={cx(
        'new-row-placeholder',
        variant === 'header' && 'new-row-placeholder--header',
        canAcceptNeedCard && 'drop-target-ready',
        isActiveDropTarget && 'drop-target-valid',
      )}
      aria-label="Opprett ny rad"
    >
      <button
        type="button"
        className={cx(
          'new-row-placeholder__button',
          variant === 'header' && 'new-row-placeholder__button--header',
        )}
        aria-label="Opprett ny rad"
        onClick={() => {
          const action = { type: 'createRow' } as const
          pushMotionEvent(action)
          dispatch(action)
        }}
      >
        <span className="new-row-placeholder__icon" aria-hidden="true">
          <Plus size={18} strokeWidth={2.25} />
        </span>
        <span className="new-row-placeholder__copy">
          <span className="new-row-placeholder__title">{title}</span>
          <span className="new-row-placeholder__text">{copy}</span>
        </span>
      </button>
    </div>
  )
}

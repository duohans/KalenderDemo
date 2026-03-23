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
}

export function NewRowPlaceholder({ activeDrag, dayId }: NewRowPlaceholderProps) {
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
  const title = isActiveDropTarget ? 'Slipp for ny rad' : 'Ny rad'
  const copy = isActiveDropTarget
    ? 'Kortet oppretter en ny rad på sitt faste tidspunkt.'
    : 'Opprett en tom rad, eller slipp et kort her for å opprette og plassere det.'

  return (
    <div
      ref={setNodeRef}
      data-testid="new-row-placeholder"
      className={cx(
        'new-row-placeholder',
        canAcceptNeedCard && 'drop-target-ready',
        isActiveDropTarget && 'drop-target-valid',
      )}
      aria-label="Opprett ny rad"
    >
      <button
        type="button"
        className="new-row-placeholder__button"
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

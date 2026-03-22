import { useDroppable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'

import { canDropOnTarget, type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectRowDisplayModel } from '../../domain/schedule/selectors.ts'
import type { TimeBlockId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import {
  useScheduleState,
} from '../schedule/useSchedule.ts'
import { TaskCard } from '../shared/TaskCard.tsx'
import { EmptyCellState } from './EmptyCellState.tsx'

type CalendarCellProps = {
  rowId: string
  timeBlockId: TimeBlockId
  cardId: string | null
  activeDrag: PlannerDragItem | null
}

export function CalendarCell({
  rowId,
  timeBlockId,
  cardId,
  activeDrag,
}: CalendarCellProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const rowDisplayModel = selectRowDisplayModel(state, rowId)
  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-cell:${rowId}:${timeBlockId}`,
    data: {
      type: 'calendar-cell',
      rowId,
      timeBlockId,
    },
  })

  const isNeedCardDragActive = activeDrag?.type === 'need-card'
  const canAcceptNeedCard =
    isNeedCardDragActive &&
    canDropOnTarget(state, activeDrag, {
      type: 'calendar-cell',
      rowId,
      timeBlockId,
    })
  const card = cardId ? state.needCards[cardId] : null

  return (
    <div
      ref={setNodeRef}
      data-testid={`calendar-cell-${rowId}-${timeBlockId}`}
      style={{ ['--row-accent' as string]: rowDisplayModel?.rowAccent ?? '#d1d5db' } as CSSProperties}
      className={cx(
        'calendar-cell',
        !card && 'calendar-cell--empty',
        isNeedCardDragActive && isOver && canAcceptNeedCard && 'drop-target-valid',
        isNeedCardDragActive && isOver && !canAcceptNeedCard && 'drop-target-invalid',
      )}
    >
      {card ? (
        <TaskCard card={card} activeDrag={activeDrag} />
      ) : (
        <EmptyCellState
          isNeedCardDragActive={Boolean(isNeedCardDragActive)}
          canAcceptNeedCard={Boolean(canAcceptNeedCard)}
        />
      )}
    </div>
  )
}

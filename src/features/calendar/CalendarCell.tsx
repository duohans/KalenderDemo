import { useDroppable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties } from 'react'

import { canDropOnTarget, type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectRowDisplayModel } from '../../domain/schedule/selectors.ts'
import type { TimeBlockId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import type { PlannerSelection } from '../layout/plannerSelection.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  getReceiveAnimation,
  getTargetActivationAnimation,
  plannerPulseTransition,
  plannerTargetSpring,
} from '../motion/plannerMotion.ts'
import { useSchedule } from '../schedule/useSchedule.ts'
import { TaskCard } from '../shared/TaskCard.tsx'
import { EmptyCellState } from './EmptyCellState.tsx'

type CalendarCellProps = {
  rowId: string
  timeBlockId: TimeBlockId
  cardId: string | null
  activeDrag: PlannerDragItem | null
  isSelected: boolean
  onOpenCard: (selection: PlannerSelection) => void
}

export function CalendarCell({
  rowId,
  timeBlockId,
  cardId,
  activeDrag,
  isSelected,
  onOpenCard,
}: CalendarCellProps) {
  const { state } = useSchedule()
  const reduceMotion = useReducedMotion() ?? false
  const { recentEvent } = usePlannerDragFeedback()
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
  const isReceivingCard =
    recentEvent?.type === 'moveNeedCardToCell' &&
    recentEvent.rowId === rowId &&
    recentEvent.timeBlockId === timeBlockId

  return (
    <motion.div
      ref={setNodeRef}
      layout
      animate={
        isReceivingCard
          ? getReceiveAnimation('card', true, reduceMotion)
          : getTargetActivationAnimation(
              'cell',
              {
                ready: Boolean(isNeedCardDragActive && canAcceptNeedCard),
                active: Boolean(isNeedCardDragActive && isOver && canAcceptNeedCard),
                invalid: Boolean(isNeedCardDragActive && isOver && !canAcceptNeedCard),
              },
              reduceMotion,
            )
      }
      transition={isReceivingCard ? plannerPulseTransition : plannerTargetSpring}
      style={{ ['--row-accent' as string]: rowDisplayModel?.rowAccent ?? '#d1d5db' } as CSSProperties}
      className={cx(
        'calendar-cell',
        !card && 'calendar-cell--empty',
        isSelected && 'selection-active',
        isNeedCardDragActive && isOver && canAcceptNeedCard && 'drop-target-valid',
        isNeedCardDragActive && isOver && !canAcceptNeedCard && 'drop-target-invalid',
      )}
    >
      {card ? (
        <TaskCard
          card={card}
          activeDrag={activeDrag}
          isSelected={isSelected}
          onOpenDetails={onOpenCard}
        />
      ) : (
        <EmptyCellState
          isNeedCardDragActive={Boolean(isNeedCardDragActive)}
          canAcceptNeedCard={Boolean(canAcceptNeedCard)}
        />
      )}
    </motion.div>
  )
}

import { useDroppable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

import { type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectUnscheduledNeedCardIds } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  getReceiveAnimation,
  getTargetActivationAnimation,
  plannerPulseTransition,
  plannerTargetSpring,
} from '../motion/plannerMotion.ts'
import {
  useScheduleState,
} from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { TaskCard } from '../shared/TaskCard.tsx'

type TasksPanelProps = {
  activeDrag: PlannerDragItem | null
}

export function TasksPanel({ activeDrag }: TasksPanelProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const reduceMotion = useReducedMotion() ?? false
  const { recentEvent } = usePlannerDragFeedback()
  const cardIds = selectUnscheduledNeedCardIds(state)
  const isEmpty = cardIds.length === 0
  const { isOver, setNodeRef } = useDroppable({
    id: 'unscheduled-panel',
    data: {
      type: 'unscheduled-panel',
    },
  })
  const isReceivingReturnedCard = recentEvent?.type === 'moveNeedCardToUnscheduled'

  return (
    <PanelFrame
      title="Uplanlagt"
      ariaLabel="Uplanlagt"
      showHeader={false}
      className="planner-sidebar planner-sidebar--tasks order-1"
    >
      <motion.div
        ref={setNodeRef}
        animate={
          isReceivingReturnedCard
            ? getReceiveAnimation('card', true, reduceMotion)
            : getTargetActivationAnimation(
                'cell',
                {
                  ready: activeDrag?.type === 'need-card',
                  active: activeDrag?.type === 'need-card' && isOver,
                },
                reduceMotion,
              )
        }
        transition={isReceivingReturnedCard ? plannerPulseTransition : plannerTargetSpring}
        className={cx(
          'panel-dropzone panel-dropzone--unscheduled flex-1 overflow-hidden',
          isEmpty && 'panel-dropzone--quiet',
          activeDrag?.type === 'need-card' && isOver && 'drop-target-valid',
        )}
        title="Dra et kort hit for å sende det tilbake til verktøyfeltet"
      >
        <div className="panel-scroll flex flex-col gap-2.5">
          {!isEmpty ? (
            cardIds.map((cardId) => (
              <TaskCard
                key={cardId}
                card={state.needCards[cardId]}
                activeDrag={activeDrag}
                variant="panel"
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="empty-panel-state empty-panel-state--quiet"
            >
              <span className="empty-panel-state__icon" aria-hidden="true">
                <Check size={15} strokeWidth={2.5} />
              </span>
              <p className="empty-panel-state__title">Alt er planlagt</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PanelFrame>
  )
}

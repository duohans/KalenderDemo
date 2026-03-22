import { useDroppable } from '@dnd-kit/core'
import { Check } from 'lucide-react'

import { type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectUnscheduledNeedCardIds } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
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
  const cardIds = selectUnscheduledNeedCardIds(state)
  const isEmpty = cardIds.length === 0
  const { isOver, setNodeRef } = useDroppable({
    id: 'unscheduled-panel',
    data: {
      type: 'unscheduled-panel',
    },
  })

  return (
    <PanelFrame
      title="Uplanlagt"
      ariaLabel="Uplanlagt"
      showHeader={false}
      className="planner-sidebar planner-sidebar--tasks order-1"
    >
      <div
        ref={setNodeRef}
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
            <div className="empty-panel-state empty-panel-state--quiet">
              <span className="empty-panel-state__icon" aria-hidden="true">
                <Check size={15} strokeWidth={2.5} />
              </span>
              <p className="empty-panel-state__title">Alt er planlagt</p>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  )
}

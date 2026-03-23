import { useDroppable } from '@dnd-kit/core'
import { Check } from 'lucide-react'

import { type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectUnscheduledNeedCardIds } from '../../domain/schedule/selectors.ts'
import type { WeekdayId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import {
  useScheduleState,
} from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { TaskCard } from '../shared/TaskCard.tsx'

type TasksPanelProps = {
  activeDrag: PlannerDragItem | null
  selectedDayId: WeekdayId
}

export function TasksPanel({ activeDrag, selectedDayId }: TasksPanelProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const cardIds = selectUnscheduledNeedCardIds(state, selectedDayId)
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
      subtitle={isEmpty ? 'Ingen åpne behov' : `${cardIds.length} uplanlagte behov`}
      ariaLabel="Uplanlagt"
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
        <div className="panel-scroll panel-scroll--compact panel-scroll--tasks-list">
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

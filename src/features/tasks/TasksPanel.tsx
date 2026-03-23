import { useDroppable } from '@dnd-kit/core'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectUnscheduledNeedCardIds } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
import {
  useScheduleState,
} from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { SideRailPager } from '../shared/SideRailPager.tsx'
import { TaskCard } from '../shared/TaskCard.tsx'

type TasksPanelProps = {
  activeDrag: PlannerDragItem | null
}

const PAGE_SIZE = 5

export function TasksPanel({ activeDrag }: TasksPanelProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const cardIds = selectUnscheduledNeedCardIds(state)
  const isEmpty = cardIds.length === 0
  const totalPages = Math.max(1, Math.ceil(cardIds.length / PAGE_SIZE))
  const [currentPage, setCurrentPage] = useState(1)
  const visiblePage = Math.min(Math.max(currentPage, 1), totalPages)
  const { isOver, setNodeRef } = useDroppable({
    id: 'unscheduled-panel',
    data: {
      type: 'unscheduled-panel',
    },
  })
  const pageStart = (visiblePage - 1) * PAGE_SIZE
  const visibleCardIds = cardIds.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages))
  }, [totalPages])

  return (
    <PanelFrame
      title="Uplanlagt"
      subtitle={isEmpty ? 'Ingen åpne behov' : `${cardIds.length} uplanlagte behov`}
      ariaLabel="Uplanlagt"
      className="planner-sidebar planner-sidebar--tasks order-1"
      footer={
        <SideRailPager
          label="Uplanlagt"
          currentPage={visiblePage}
          totalPages={totalPages}
          onPrevious={() => {
            setCurrentPage((page) => Math.max(page - 1, 1))
          }}
          onNext={() => {
            setCurrentPage((page) => Math.min(page + 1, totalPages))
          }}
        />
      }
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
            visibleCardIds.map((cardId) => (
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

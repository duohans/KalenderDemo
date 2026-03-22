import { CalendarDays, Layers3 } from 'lucide-react'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { selectCellNeedCardIdMap } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { RowLane } from './RowLane.tsx'
import { TimeHeader } from './TimeHeader.tsx'

type CalendarGridProps = {
  activeDrag: PlannerDragItem | null
  dayLabel: string
}

export function CalendarGrid({ activeDrag, dayLabel }: CalendarGridProps) {
  const rowOrder = useScheduleState((state) => state.rowOrder)
  const cellNeedCardMap = useScheduleState((state) => selectCellNeedCardIdMap(state))

  return (
    <section
      aria-label="Dagstavle"
      className="planner-stage order-2 flex min-h-0 flex-1 flex-col gap-2.5"
    >
      <div className="planner-grid-frame relative flex min-h-0 flex-1 flex-col">
        <div className="planner-stage__header">
          <h2 className="sr-only">Dagstavle</h2>
          <div className="planner-stage__chips">
            <span className="planner-chip planner-chip--board">
              <CalendarDays size={15} strokeWidth={2.1} aria-hidden="true" />
              {dayLabel}
            </span>
            <span className="planner-chip planner-chip--board">
              <Layers3 size={15} strokeWidth={2.1} aria-hidden="true" />
              {rowOrder.length} rader
            </span>
          </div>
        </div>
        <div className="planner-grid-scroll flex-1">
          <div className="calendar-board w-full">
            <div className="calendar-header-grid">
              <div className="calendar-header-spacer">
                <p className="calendar-header-spacer__title">Ansvar</p>
              </div>
              {TIME_BLOCKS.map((block) => (
                <TimeHeader key={block.id} block={block} />
              ))}
            </div>

            <div className="mt-2 space-y-2">
              {rowOrder.map((rowId) => (
                <RowLane
                  key={rowId}
                  rowId={rowId}
                  cellNeedCardMap={cellNeedCardMap}
                  activeDrag={activeDrag}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

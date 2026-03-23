import { CalendarDays, Layers3 } from 'lucide-react'
import type { CSSProperties } from 'react'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { buildCellKey, selectCellNeedCardIdMap } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { WeekdayId } from '../../domain/schedule/types.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { CalendarCell } from './CalendarCell.tsx'
import { NewRowPlaceholder } from './NewRowPlaceholder.tsx'
import { TimeHeader } from './TimeHeader.tsx'
import { RowHeaderDropZone } from './RowHeaderDropZone.tsx'

type CalendarGridProps = {
  activeDrag: PlannerDragItem | null
  dayLabel: string
  selectedDayId: WeekdayId
}

export function CalendarGrid({ activeDrag, dayLabel, selectedDayId }: CalendarGridProps) {
  const rowOrder = useScheduleState((state) => state.rowOrder)
  const cellNeedCardMap = useScheduleState((state) => selectCellNeedCardIdMap(state, selectedDayId))
  const rowCountLabel = `${rowOrder.length} ${rowOrder.length === 1 ? 'rad' : 'rader'}`
  const laneColumnTrack = 'minmax(var(--planner-lane-column-width), var(--planner-lane-column-width))'
  const boardGridTemplateColumns = [
    'var(--planner-time-axis-width)',
    ...rowOrder.map(() => laneColumnTrack),
    laneColumnTrack,
  ].join(' ')

  return (
    <section
      aria-label="Dagstavle"
      className="planner-stage order-2 flex min-h-0 flex-1 flex-col gap-2.5"
    >
      <div className="planner-grid-frame relative flex min-h-0 flex-1 flex-col">
        <div className="planner-stage__header">
          <div className="planner-stage__heading">
            <h2 className="planner-stage__title planner-heading">Dagstavle</h2>
          </div>
          <div className="planner-stage__chips">
            <span className="planner-chip planner-chip--board">
              <CalendarDays size={15} strokeWidth={2.1} aria-hidden="true" />
              {dayLabel}
            </span>
            <span className="planner-chip planner-chip--board">
              <Layers3 size={15} strokeWidth={2.1} aria-hidden="true" />
              {rowCountLabel}
            </span>
          </div>
        </div>
        <div className="planner-grid-scroll flex-1">
          <div
            className="calendar-board"
            style={{ ['--calendar-board-columns' as string]: boardGridTemplateColumns } as CSSProperties}
          >
            <div className="calendar-lane-header-grid">
              <div className="calendar-header-spacer calendar-header-spacer--time-axis">
                <p className="calendar-header-spacer__title">Tid</p>
              </div>
              {rowOrder.map((rowId) => (
                <RowHeaderDropZone
                  key={rowId}
                  rowId={rowId}
                  dayId={selectedDayId}
                  activeDrag={activeDrag}
                  variant="header"
                />
              ))}
              <NewRowPlaceholder activeDrag={activeDrag} dayId={selectedDayId} variant="header" />
            </div>

            <div className="calendar-time-grid">
              {TIME_BLOCKS.map((block) => (
                <div key={block.id} className="calendar-time-row-grid">
                  <TimeHeader block={block} orientation="axis" />
                  {rowOrder.map((rowId) => {
                    const cardId = cellNeedCardMap.get(buildCellKey(rowId, block.id)) ?? null

                    return (
                      <CalendarCell
                        key={`${rowId}-${block.id}`}
                        rowId={rowId}
                        dayId={selectedDayId}
                        timeBlockId={block.id}
                        cardId={cardId}
                        activeDrag={activeDrag}
                      />
                    )
                  })}
                  <div className="calendar-column-spacer" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

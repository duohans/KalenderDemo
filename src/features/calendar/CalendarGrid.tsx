import { CalendarDays, Layers3 } from 'lucide-react'
import { Fragment, useMemo, type CSSProperties } from 'react'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import {
  buildCellKey,
  selectCellNeedCardIdMap,
  selectRowDisplayModel,
} from '../../domain/schedule/selectors.ts'
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
  const state = useScheduleState((plannerState) => plannerState)
  const rowDescriptors = useMemo(
    () =>
      state.rowOrder.map((rowId) => {
        const displayModel = selectRowDisplayModel(state, rowId, selectedDayId)
        const laneState =
          displayModel && displayModel.cardCount === 0 && !displayModel.responsible
            ? 'idle'
            : 'active'

        return {
          rowId,
          laneState,
          rowAccent: displayModel?.rowAccent ?? '#d1d5db',
        }
      }),
    [selectedDayId, state],
  )
  const cellNeedCardMap = useMemo(
    () => selectCellNeedCardIdMap(state, selectedDayId),
    [selectedDayId, state],
  )
  const laneCount = rowDescriptors.length
  const rowCountLabel = `${laneCount} ${laneCount === 1 ? 'rad' : 'rader'}`
  const boardGridTemplateColumns = [
    'var(--planner-time-axis-width)',
    ...rowDescriptors.map(() => 'var(--calendar-board-lane-track)'),
    'var(--calendar-board-placeholder-track)',
  ].join(' ')
  const boardGridTemplateRows = [
    'var(--calendar-header-height)',
    ...TIME_BLOCKS.map(() => 'minmax(var(--lane-height), auto)'),
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
        <div className="planner-grid-scroll planner-grid-scroll--calendar flex-1">
          <div
            className="calendar-board"
            data-lane-count={laneCount}
            style={
              {
                ['--calendar-board-columns' as string]: boardGridTemplateColumns,
                ['--calendar-board-rows' as string]: boardGridTemplateRows,
              } as CSSProperties
            }
          >
            <div className="calendar-board__corner">
              <div className="calendar-header-spacer calendar-header-spacer--time-axis">
                <p className="calendar-header-spacer__title">Tid</p>
              </div>
            </div>

            {rowDescriptors.map(({ rowAccent, rowId, laneState }) => (
              <div
                key={`header-${rowId}`}
                className="calendar-board__lane"
                data-lane-state={laneState}
                style={{ ['--row-accent' as string]: rowAccent } as CSSProperties}
              >
                <RowHeaderDropZone
                  rowId={rowId}
                  dayId={selectedDayId}
                  activeDrag={activeDrag}
                  variant="header"
                />
              </div>
            ))}

            <div className="calendar-board__add-lane">
              <NewRowPlaceholder activeDrag={activeDrag} dayId={selectedDayId} variant="header" />
            </div>

            {TIME_BLOCKS.map((block, blockIndex) => {
              const rowTone = blockIndex % 2 === 0 ? 'odd' : 'even'
              const isLastRow = blockIndex === TIME_BLOCKS.length - 1

              return (
                <Fragment key={block.id}>
                  <div
                    className="calendar-board__time"
                    data-row-tone={rowTone}
                    data-last-row={isLastRow ? 'true' : undefined}
                  >
                    <TimeHeader block={block} orientation="axis" />
                  </div>

                  {rowDescriptors.map(({ rowAccent, rowId, laneState }) => {
                    const cardId = cellNeedCardMap.get(buildCellKey(rowId, block.id)) ?? null

                    return (
                      <div
                        key={`${rowId}-${block.id}`}
                        className="calendar-board__slot"
                        data-lane-state={laneState}
                        data-row-tone={rowTone}
                        style={{ ['--row-accent' as string]: rowAccent } as CSSProperties}
                      >
                        <CalendarCell
                          rowId={rowId}
                          dayId={selectedDayId}
                          timeBlockId={block.id}
                          cardId={cardId}
                          activeDrag={activeDrag}
                        />
                      </div>
                    )
                  })}

                  <div
                    className="calendar-board__buffer"
                    data-row-tone={rowTone}
                    data-last-row={isLastRow ? 'true' : undefined}
                    aria-hidden="true"
                  />
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

import { CalendarDays, Layers3 } from 'lucide-react'

import { PanelSurface } from '@/components/ui/panel'
import { EmptyCell } from '@/features/planner/components/empty-cell'
import { NeedCard } from '@/features/planner/components/need-card'
import { PlannerRowHeader } from '@/features/planner/components/planner-row-header'
import type { PlannerBoardViewModel } from '@/features/planner/selectors/planner-selectors'
import {
  PLANNER_GRID_HEADER_HEIGHT_PX,
  PLANNER_ROW_HEADER_WIDTH_PX,
  PLANNER_ROW_HEIGHT_PX,
  PLANNER_TIME_BLOCK_MIN_WIDTH_PX,
} from '@/features/planner/utils/planner-layout'

interface PlannerBoardProps {
  board: PlannerBoardViewModel
  dayLabel: string
  onClearRowResponsible: (rowId: string) => void
  onClearExplicitAssignee: (cardId: string) => void
}

export function PlannerBoard({
  board,
  dayLabel,
  onClearRowResponsible,
  onClearExplicitAssignee,
}: PlannerBoardProps) {
  const minBoardWidth =
    PLANNER_ROW_HEADER_WIDTH_PX + board.timeBlocks.length * PLANNER_TIME_BLOCK_MIN_WIDTH_PX

  return (
    <PanelSurface
      emphasis="board"
      data-testid="planner-board"
      className="flex h-full min-h-[760px] flex-col p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-micro text-stone-500">Planner board</p>
          <h2 className="mt-1 font-display text-[1.8rem] leading-none text-ink-800">Dagstavle</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-sm font-medium text-stone-600">
            <CalendarDays className="h-4 w-4" />
            {dayLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-sm font-medium text-stone-600">
            <Layers3 className="h-4 w-4" />
            {board.rows.length} rader
          </span>
        </div>
      </div>

      <div className="mt-5 flex-1 overflow-x-auto pb-1">
        <div
          data-testid="planner-grid"
          className="grid gap-2"
          style={{
            minWidth: `${minBoardWidth}px`,
            gridTemplateColumns: `${PLANNER_ROW_HEADER_WIDTH_PX}px repeat(${board.timeBlocks.length}, minmax(${PLANNER_TIME_BLOCK_MIN_WIDTH_PX}px, 1fr))`,
            gridTemplateRows: `${PLANNER_GRID_HEADER_HEIGHT_PX}px repeat(${board.rows.length}, ${PLANNER_ROW_HEIGHT_PX}px)`,
          }}
        >
          <div className="flex h-full items-center rounded-[1.5rem] border border-stone-200 bg-[#fbf7ef] px-4">
            <div>
              <p className="text-micro text-stone-500">Lanes</p>
              <p className="mt-1 text-sm font-semibold text-ink-800">Ansvar</p>
            </div>
          </div>

          {board.timeBlocks.map((timeBlock) => (
            <div
              key={timeBlock.id}
              className="flex h-full flex-col justify-center rounded-[1.5rem] border border-stone-200 bg-[#fbf7ef] px-4"
            >
              <p className="text-sm font-semibold text-ink-800">{timeBlock.label}</p>
              <p className="mt-1 text-xs text-stone-500">
                {timeBlock.start} - {timeBlock.end}
              </p>
            </div>
          ))}

          {board.rows.flatMap((rowView) => [
            <PlannerRowHeader
              key={`header-${rowView.row.id}`}
              rowView={rowView}
              onClearRowResponsible={onClearRowResponsible}
            />,
            ...rowView.cells.map((cell) => (
              <div
                key={cell.id}
                data-testid={`cell-${cell.rowId}-${cell.timeBlock.id}`}
                data-drop-role="cell"
                className="h-full rounded-[1.45rem] border border-stone-200/80 bg-white/55 p-2"
              >
                {cell.card ? (
                  <NeedCard
                    cardView={cell.card}
                    onClearExplicitAssignee={onClearExplicitAssignee}
                  />
                ) : (
                  <EmptyCell />
                )}
              </div>
            )),
          ])}
        </div>
      </div>
    </PanelSurface>
  )
}

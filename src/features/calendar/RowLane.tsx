import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { buildCellKey } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { WeekdayId } from '../../domain/schedule/types.ts'
import { CalendarCell } from './CalendarCell.tsx'
import { RowHeaderDropZone } from './RowHeaderDropZone.tsx'

type RowLaneProps = {
  rowId: string
  dayId: WeekdayId
  cellNeedCardMap: Map<string, string>
  activeDrag: PlannerDragItem | null
}

export function RowLane({
  rowId,
  dayId,
  cellNeedCardMap,
  activeDrag,
}: RowLaneProps) {
  return (
    <div className="calendar-row-grid">
      <RowHeaderDropZone rowId={rowId} dayId={dayId} activeDrag={activeDrag} />
      {TIME_BLOCKS.map((block) => {
        const cardId = cellNeedCardMap.get(buildCellKey(rowId, block.id)) ?? null

        return (
          <CalendarCell
            key={block.id}
            rowId={rowId}
            dayId={dayId}
            timeBlockId={block.id}
            cardId={cardId}
            activeDrag={activeDrag}
          />
        )
      })}
    </div>
  )
}

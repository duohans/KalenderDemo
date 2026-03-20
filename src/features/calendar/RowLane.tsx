import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { buildCellKey } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { CalendarCell } from './CalendarCell.tsx'
import { RowHeaderDropZone } from './RowHeaderDropZone.tsx'

type RowLaneProps = {
  rowId: string
  cellNeedCardMap: Map<string, string>
  activeDrag: PlannerDragItem | null
}

export function RowLane({
  rowId,
  cellNeedCardMap,
  activeDrag,
}: RowLaneProps) {
  return (
    <div className="calendar-row-grid">
      <RowHeaderDropZone rowId={rowId} activeDrag={activeDrag} />
      {TIME_BLOCKS.map((block) => {
        const cardId = cellNeedCardMap.get(buildCellKey(rowId, block.id)) ?? null

        return (
          <CalendarCell
            key={block.id}
            rowId={rowId}
            timeBlockId={block.id}
            cardId={cardId}
            activeDrag={activeDrag}
          />
        )
      })}
    </div>
  )
}

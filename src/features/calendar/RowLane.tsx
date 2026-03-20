import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { buildCellKey } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import {
  isNeedCardSelection,
  isRowSelection,
  type PlannerSelection,
} from '../layout/plannerSelection.ts'
import { CalendarCell } from './CalendarCell.tsx'
import { RowHeaderDropZone } from './RowHeaderDropZone.tsx'

type RowLaneProps = {
  rowId: string
  cellNeedCardMap: Map<string, string>
  activeDrag: PlannerDragItem | null
  selection: PlannerSelection | null
  onClearRowResponsible: (rowId: string) => void
  onOpenSelection: (selection: PlannerSelection) => void
}

export function RowLane({
  rowId,
  cellNeedCardMap,
  activeDrag,
  selection,
  onClearRowResponsible,
  onOpenSelection,
}: RowLaneProps) {
  return (
    <div className="calendar-row-grid">
      <RowHeaderDropZone
        rowId={rowId}
        activeDrag={activeDrag}
        isSelected={isRowSelection(selection, rowId)}
        onClearRowResponsible={onClearRowResponsible}
        onOpenDetails={onOpenSelection}
      />
      {TIME_BLOCKS.map((block) => {
        const cardId = cellNeedCardMap.get(buildCellKey(rowId, block.id)) ?? null

        return (
          <CalendarCell
            key={block.id}
            rowId={rowId}
            timeBlockId={block.id}
            cardId={cardId}
            activeDrag={activeDrag}
            isSelected={cardId ? isNeedCardSelection(selection, cardId) : false}
            onOpenCard={onOpenSelection}
          />
        )
      })}
    </div>
  )
}

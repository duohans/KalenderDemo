import { motion } from 'framer-motion'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import { selectCellNeedCardIdMap } from '../../domain/schedule/selectors.ts'
import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { PlannerDetailSheet } from '../layout/PlannerDetailSheet.tsx'
import type { PlannerSelection } from '../layout/plannerSelection.ts'
import { useSchedule } from '../schedule/useSchedule.ts'
import { RowLane } from './RowLane.tsx'
import { TimeHeader } from './TimeHeader.tsx'

type CalendarGridProps = {
  activeDrag: PlannerDragItem | null
  selection: PlannerSelection | null
  onClearRowResponsible: (rowId: string) => void
  onOpenSelection: (selection: PlannerSelection) => void
  onCloseSelection: () => void
}

export function CalendarGrid({
  activeDrag,
  selection,
  onClearRowResponsible,
  onOpenSelection,
  onCloseSelection,
}: CalendarGridProps) {
  const { state } = useSchedule()
  const cellNeedCardMap = selectCellNeedCardIdMap(state)

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="planner-stage order-1 flex min-h-[43.5rem] flex-col gap-2.5 xl:order-2"
    >
      <h1 className="sr-only">Dagsplan</h1>

      <div className="planner-grid-frame relative flex min-h-0 flex-1 flex-col">
        <div className="planner-grid-scroll flex-1 p-2 md:p-3">
          <div className="calendar-board w-full">
            <div className="calendar-header-grid">
              <div aria-hidden="true" className="calendar-header-spacer" />
              {TIME_BLOCKS.map((block) => (
                <TimeHeader key={block.id} block={block} />
              ))}
            </div>

            <div className="mt-2 space-y-2">
              {state.rowOrder.map((rowId) => (
                <RowLane
                  key={rowId}
                  rowId={rowId}
                  cellNeedCardMap={cellNeedCardMap}
                  activeDrag={activeDrag}
                  selection={selection}
                  onClearRowResponsible={onClearRowResponsible}
                  onOpenSelection={onOpenSelection}
                />
              ))}
            </div>
          </div>
        </div>

        <PlannerDetailSheet
          selection={selection}
          onClose={onCloseSelection}
          onClearRowResponsible={onClearRowResponsible}
          onSelectCard={(cardId) => onOpenSelection({ kind: 'need-card', cardId })}
        />
      </div>
    </motion.section>
  )
}

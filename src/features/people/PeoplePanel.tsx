import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { PersonCard } from '../shared/PersonCard.tsx'

type PeoplePanelProps = {
  activeDrag: PlannerDragItem | null
}

export function PeoplePanel({ activeDrag }: PeoplePanelProps) {
  const substituteOrder = useScheduleState((state) => state.substituteOrder)
  const substitutes = useScheduleState((state) => state.substitutes)
  const useCompactDensity = substituteOrder.length > 5

  return (
    <PanelFrame
      title="Vikarer"
      tooltip="Rad = standardansvar. Kort = overstyring."
      meta={<span className="panel-count">{substituteOrder.length}</span>}
      tone="neutral"
      headerStyle="split"
      className="order-3"
    >
      <div
        className={[
          'panel-scroll flex flex-col gap-2',
          useCompactDensity ? 'panel-scroll--compact' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {substituteOrder.map((substituteId) => (
          <PersonCard
            key={substituteId}
            person={substitutes[substituteId]}
            activeDrag={activeDrag}
          />
        ))}
      </div>
    </PanelFrame>
  )
}

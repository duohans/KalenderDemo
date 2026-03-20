import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { useSchedule } from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { PersonCard } from '../shared/PersonCard.tsx'

type PeoplePanelProps = {
  activeDrag: PlannerDragItem | null
}

export function PeoplePanel({ activeDrag }: PeoplePanelProps) {
  const { state } = useSchedule()
  const useCompactDensity = state.substituteOrder.length > 5

  return (
    <PanelFrame
      title="Vikarer"
      tooltip="Rad = standardansvar. Kort = overstyring."
      meta={<span className="panel-count">{state.substituteOrder.length}</span>}
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
        {state.substituteOrder.map((substituteId) => (
          <PersonCard
            key={substituteId}
            person={state.substitutes[substituteId]}
            activeDrag={activeDrag}
          />
        ))}
      </div>
    </PanelFrame>
  )
}

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectSubstituteWorkloads } from '../../domain/schedule/selectors.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { PersonCard } from '../shared/PersonCard.tsx'

type PeoplePanelProps = {
  activeDrag: PlannerDragItem | null
}

export function PeoplePanel({ activeDrag }: PeoplePanelProps) {
  const substituteWorkloads = useScheduleState(selectSubstituteWorkloads)

  return (
    <PanelFrame
      title="Vikarer"
      ariaLabel="Vikarer"
      showHeader={false}
      className="planner-sidebar planner-sidebar--people order-3"
    >
      <div className="panel-scroll flex flex-col gap-2.5">
        {substituteWorkloads.map((workload) => (
          <PersonCard
            key={workload.substitute.id}
            workload={workload}
            activeDrag={activeDrag}
          />
        ))}
      </div>
    </PanelFrame>
  )
}

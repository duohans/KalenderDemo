import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectSubstituteWorkloads } from '../../domain/schedule/selectors.ts'
import { useEffect, useState } from 'react'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { PanelFrame } from '../shared/PanelFrame.tsx'
import { PersonCard } from '../shared/PersonCard.tsx'
import { SideRailPager } from '../shared/SideRailPager.tsx'

type PeoplePanelProps = {
  activeDrag: PlannerDragItem | null
}

const PAGE_SIZE = 5

export function PeoplePanel({ activeDrag }: PeoplePanelProps) {
  const substituteWorkloads = useScheduleState(selectSubstituteWorkloads)
  const totalPages = Math.max(1, Math.ceil(substituteWorkloads.length / PAGE_SIZE))
  const [currentPage, setCurrentPage] = useState(1)
  const visiblePage = Math.min(Math.max(currentPage, 1), totalPages)
  const pageStart = (visiblePage - 1) * PAGE_SIZE
  const visibleWorkloads = substituteWorkloads.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setCurrentPage((page) => Math.min(Math.max(page, 1), totalPages))
  }, [totalPages])

  return (
    <PanelFrame
      title="Vikarer"
      subtitle={`${substituteWorkloads.length} tilgjengelige vikarer`}
      ariaLabel="Vikarer"
      className="planner-sidebar planner-sidebar--people order-3"
      footer={
        <SideRailPager
          label="Vikarer"
          currentPage={visiblePage}
          totalPages={totalPages}
          onPrevious={() => {
            setCurrentPage((page) => Math.max(page - 1, 1))
          }}
          onNext={() => {
            setCurrentPage((page) => Math.min(page + 1, totalPages))
          }}
        />
      }
    >
      <div className="panel-scroll flex flex-col gap-2.5">
        {visibleWorkloads.map((workload) => (
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

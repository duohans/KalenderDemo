import { CheckCheck, ShieldAlert, Users2 } from 'lucide-react'

import { PlannerBoard } from '@/features/planner/components/planner-board'
import { SubstituteCard } from '@/features/planner/components/substitute-card'
import { ToolPanel } from '@/features/planner/components/tool-panel'
import {
  selectPlannerBoard,
  selectPlannerSummary,
  selectSubstituteWorkloads,
} from '@/features/planner/selectors/planner-selectors'
import { usePlannerStore } from '@/features/planner/state/planner-store'

export function PlannerScreen() {
  const planner = usePlannerStore((state) => state.planner)
  const dayLabel = usePlannerStore((state) => state.ui.dayLabel)
  const setRowResponsible = usePlannerStore((state) => state.setRowResponsible)
  const setCardExplicitAssignee = usePlannerStore((state) => state.setCardExplicitAssignee)

  const board = selectPlannerBoard(planner)
  const summary = selectPlannerSummary(planner)
  const substituteWorkloads = selectSubstituteWorkloads(planner)

  return (
    <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 xl:px-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-micro text-stone-500">Subplanner v2 foundation</p>
          <h1 className="mt-2 max-w-3xl font-display text-[2.4rem] leading-[0.95] text-ink-800 sm:text-[3rem]">
            Bygget for robuste vikarplaner, ikke for tilfeldige kalender-hacks.
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-3 py-2 text-sm font-medium text-stone-600">
            <ShieldAlert className="h-4 w-4" />
            {summary.unassignedCards} udekket
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-3 py-2 text-sm font-medium text-stone-600">
            <CheckCheck className="h-4 w-4" />
            {Math.round(summary.coverageRate * 100)}% dekning
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-3 py-2 text-sm font-medium text-stone-600">
            <Users2 className="h-4 w-4" />
            {substituteWorkloads.length} vikarer
          </div>
        </div>
      </header>

      <div className="grid flex-1 gap-4 xl:grid-cols-[var(--planner-side-width)_minmax(0,1fr)_var(--planner-side-width)]">
        <ToolPanel
          title="Uplanlagt"
          subtitle={`${summary.unassignedCards} behov uten aktiv dekning`}
          tooltip="Viser behov som mangler effektiv tildeling. Verktoypanelet er bevisst kompakt og uten intern scrolling."
          testId="unplanned-panel"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="surface-quiet px-3 py-3">
              <p className="text-micro text-stone-500">Udekket</p>
              <p className="mt-2 text-2xl font-semibold text-ink-800">{summary.unassignedCards}</p>
            </div>
            <div className="surface-quiet px-3 py-3">
              <p className="text-micro text-stone-500">Overstyrt</p>
              <p className="mt-2 text-2xl font-semibold text-ink-800">{summary.explicitOverrides}</p>
            </div>
            <div className="surface-quiet px-3 py-3">
              <p className="text-micro text-stone-500">Rader</p>
              <p className="mt-2 text-2xl font-semibold text-ink-800">{summary.rowAssignments}</p>
            </div>
          </div>

          {summary.unassignedItems.map((item) => (
            <div key={item.id} className="surface-quiet px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{item.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.timeLabel} • {item.sourceTeacherName}
                  </p>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-600">
                  {item.rowTitle}
                </span>
              </div>
            </div>
          ))}
        </ToolPanel>

        <PlannerBoard
          board={board}
          dayLabel={dayLabel}
          onClearRowResponsible={(rowId) => setRowResponsible(rowId, null)}
          onClearExplicitAssignee={(cardId) => setCardExplicitAssignee(cardId, null)}
        />

        <ToolPanel
          title="Vikarer"
          subtitle={`${substituteWorkloads.length} tilgjengelige profiler`}
          tooltip="Viser vikarpoolen med effektiv dekning, radansvar og eksplisitte overstyringer. Drag and drop kobles i neste fase."
          testId="substitute-panel"
        >
          {substituteWorkloads.map((workload) => (
            <SubstituteCard key={workload.substitute.id} workload={workload} />
          ))}
        </ToolPanel>
      </div>
    </div>
  )
}

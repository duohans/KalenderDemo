import { X } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import type { PlannerRowViewModel } from '@/features/planner/selectors/planner-selectors'

interface PlannerRowHeaderProps {
  rowView: PlannerRowViewModel
  onClearRowResponsible: (rowId: string) => void
}

export function PlannerRowHeader({
  rowView,
  onClearRowResponsible,
}: PlannerRowHeaderProps) {
  return (
    <div
      data-testid={`row-header-${rowView.row.id}`}
      data-drop-role="row"
      className="flex h-full flex-col justify-between rounded-[1.6rem] border border-stone-200/90 bg-[#fbf7ef] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {rowView.rowResponsible ? (
            <Avatar
              initials={rowView.rowResponsible.initials}
              label={rowView.rowResponsible.name}
              color={rowView.rowResponsible.avatarColor}
              size="md"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300 bg-white/70 text-xs font-semibold text-stone-400">
              +
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-800">{rowView.title}</p>
            <p className="mt-1 text-xs text-stone-500">
              {rowView.cells.filter((cell) => cell.card).length} blokker
            </p>
          </div>
        </div>

        {rowView.rowResponsible ? (
          <button
            type="button"
            title="Fjern radansvar"
            aria-label="Fjern radansvar"
            onClick={() => onClearRowResponsible(rowView.row.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-stone-400 transition hover:border-stone-200 hover:bg-white hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rowView.sourceTeachers.map((teacher) => (
          <span
            key={teacher.id}
            title={teacher.name}
            className="inline-flex items-center rounded-full border border-stone-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-600"
          >
            {teacher.firstName}
          </span>
        ))}
      </div>
    </div>
  )
}

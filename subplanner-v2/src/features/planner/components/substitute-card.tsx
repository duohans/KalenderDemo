import { Avatar } from '@/components/ui/avatar'
import type { SubstituteWorkload } from '@/features/planner/selectors/planner-selectors'

export function SubstituteCard({ workload }: { workload: SubstituteWorkload }) {
  const { substitute, effectiveCoverageCount, explicitOverrides, rowAssignments } = workload

  return (
    <div className="surface-quiet flex items-center gap-3 px-3 py-3">
      <Avatar
        initials={substitute.initials}
        label={substitute.name}
        color={substitute.avatarColor}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink-800">{substitute.name}</p>
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-stone-600">
            {effectiveCoverageCount}
          </span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          {rowAssignments} rader • {explicitOverrides} overstyringer
        </p>
      </div>
    </div>
  )
}

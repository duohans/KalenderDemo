import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { SubstituteWorkload } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'

type PersonCardProps = {
  workload: SubstituteWorkload
  activeDrag: PlannerDragItem | null
}

function splitDisplayName(name: string) {
  const [firstName = '', ...remainder] = name.trim().split(/\s+/)

  return {
    firstName: firstName || name,
    surname: remainder.join(' '),
  }
}

export function PersonCard({ workload, activeDrag }: PersonCardProps) {
  const { substitute } = workload
  const displayName = splitDisplayName(substitute.name)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `substitute:${substitute.id}`,
    data: {
      type: 'substitute',
      substituteId: substitute.id,
      from: { type: 'substitute-pool' },
    },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        touchAction: 'none',
      }}
      className="relative"
    >
      <button
        type="button"
        className={cx(
          'substitute-card',
          isDragging && 'opacity-0',
          activeDrag?.type === 'substitute' &&
            activeDrag.substituteId === substitute.id &&
            'substitute-card--active',
        )}
        style={
          {
            ['--badge-accent' as string]: substitute.accentColor,
          } as CSSProperties
        }
        aria-label={`Vikar ${substitute.name}`}
        {...listeners}
        {...attributes}
      >
        <span className="substitute-card__identity">
          <span className="substitute-card__avatar">{substitute.avatarInitials}</span>
          <span className="substitute-card__name-stack min-w-0 text-left" title={substitute.name}>
            <span className="substitute-card__first-name">{displayName.firstName}</span>
            {displayName.surname ? (
              <span className="substitute-card__last-name">{displayName.surname}</span>
            ) : null}
          </span>
        </span>
        <span className="substitute-card__grip" aria-hidden="true">
          <GripVertical size={17} strokeWidth={2.25} />
        </span>
      </button>
    </div>
  )
}

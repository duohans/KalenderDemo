import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion, useReducedMotion } from 'framer-motion'
import { GripVertical, UserPlus } from 'lucide-react'
import type { CSSProperties } from 'react'

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type { SubstituteWorkload } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  getRejectAnimation,
  getSourceGhostAnimation,
  plannerHoverSpring,
  plannerLayoutSpring,
  plannerRejectTransition,
} from '../motion/plannerMotion.ts'

type PersonCardProps = {
  workload: SubstituteWorkload
  activeDrag: PlannerDragItem | null
}

function formatToolName(name: string) {
  if (name.length <= 18) {
    return name
  }

  const [firstName = '', lastName = ''] = name.trim().split(/\s+/)
  return lastName ? `${firstName} ${lastName[0]}.` : firstName
}

export function PersonCard({ workload, activeDrag }: PersonCardProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { rejectedDrag } = usePlannerDragFeedback()
  const { effectiveCoverageCount, explicitOverrides, rowAssignments, substitute } = workload
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `substitute:${substitute.id}`,
    data: {
      type: 'substitute',
      substituteId: substitute.id,
      from: { type: 'substitute-pool' },
    },
  })
  const isRejected =
    rejectedDrag?.item.type === 'substitute' &&
    rejectedDrag.item.substituteId === substitute.id

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        touchAction: 'none',
      }}
      className="relative"
    >
      <motion.div
        aria-hidden="true"
        className="substitute-card-ghost"
        initial={false}
        animate={getSourceGhostAnimation(isDragging, reduceMotion)}
        transition={plannerHoverSpring}
      />
      <motion.button
        layout
        type="button"
        whileHover={reduceMotion ? undefined : { scale: 1.015, y: -1 }}
        whileTap={reduceMotion ? undefined : { scale: 0.992 }}
        animate={
          isRejected
            ? getRejectAnimation('substitute', reduceMotion)
            : { scale: 1, x: 0, y: 0, rotate: 0 }
        }
        transition={isRejected ? plannerRejectTransition : plannerLayoutSpring}
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
        <span className="substitute-card__avatar">{substitute.avatarInitials}</span>
        <span className="min-w-0 flex-1 text-left">
          <span className="substitute-card__headline">
            <span className="substitute-card__name block truncate text-[1rem] leading-none">
              {formatToolName(substitute.name)}
            </span>
            <span className="substitute-card__count" aria-hidden="true">
              {effectiveCoverageCount}
            </span>
          </span>
          <span className="substitute-card__details">
            {rowAssignments} rader • {explicitOverrides} overstyringer
          </span>
        </span>
        <span className="substitute-card__meta" aria-hidden="true">
          <span className="substitute-card__assignment">
            <UserPlus size={16} strokeWidth={2.25} />
          </span>
          <span className="substitute-card__grip">
            <GripVertical size={16} strokeWidth={2.25} />
          </span>
        </span>
      </motion.button>
    </div>
  )
}

import { motion, useReducedMotion } from 'framer-motion'
import { CircleDashed, Plus, X } from 'lucide-react'
import { cx } from '../../lib/cx.ts'
import {
  getTargetActivationAnimation,
  plannerTargetSpring,
} from '../motion/plannerMotion.ts'

type EmptyCellStateProps = {
  isNeedCardDragActive: boolean
  canAcceptNeedCard: boolean
}

export function EmptyCellState({
  isNeedCardDragActive,
  canAcceptNeedCard,
}: EmptyCellStateProps) {
  const reduceMotion = useReducedMotion() ?? false
  const isReady = isNeedCardDragActive && canAcceptNeedCard
  const isBlocked = isNeedCardDragActive && !canAcceptNeedCard
  const Icon = isNeedCardDragActive ? (canAcceptNeedCard ? Plus : X) : CircleDashed
  const label = isNeedCardDragActive ? (canAcceptNeedCard ? 'Slipp her' : 'Opptatt') : 'Tom celle'

  return (
    <motion.div
      initial={false}
      animate={getTargetActivationAnimation(
        'cell',
        {
          ready: isNeedCardDragActive,
          active: isReady,
          invalid: isBlocked,
        },
        reduceMotion,
      )}
      transition={plannerTargetSpring}
      className={cx(
        'empty-cell-state',
        isNeedCardDragActive && 'empty-cell-state--engaged',
        isReady && 'empty-cell-state--ready',
        isBlocked && 'empty-cell-state--blocked',
      )}
      data-testid="empty-cell-state"
      data-ready={isReady ? 'true' : 'false'}
      aria-label={label}
    >
      <span aria-hidden="true" className="empty-cell-state__glyph">
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span aria-hidden="true" className="empty-cell-state__line" />
      {isNeedCardDragActive ? (
        <span aria-hidden="true" className="empty-cell-state__label">
          {label}
        </span>
      ) : null}
    </motion.div>
  )
}

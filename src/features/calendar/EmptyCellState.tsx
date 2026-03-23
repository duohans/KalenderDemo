import { CircleDashed } from 'lucide-react'
import { cx } from '../../lib/cx.ts'

type EmptyCellStateProps = {
  isNeedCardDragActive: boolean
  canAcceptNeedCard: boolean
  isOver: boolean
}

export function EmptyCellState({
  isNeedCardDragActive,
  canAcceptNeedCard,
  isOver,
}: EmptyCellStateProps) {
  const isTargeted = isNeedCardDragActive && isOver
  const isReady = isTargeted && canAcceptNeedCard
  const isBlocked = isTargeted && !canAcceptNeedCard
  const Icon = isTargeted ? null : CircleDashed
  const label = isReady ? 'Slipp her' : isBlocked ? 'Kan ikke slippes her' : 'Tom celle'

  return (
    <div
      className={cx(
        'empty-cell-state',
        isTargeted && 'empty-cell-state--engaged',
        isReady && 'empty-cell-state--ready',
        isBlocked && 'empty-cell-state--blocked',
      )}
      data-testid="empty-cell-state"
      data-ready={isReady ? 'true' : 'false'}
      aria-label={label}
    >
      {Icon ? (
        <span aria-hidden="true" className="empty-cell-state__glyph">
          <Icon size={18} strokeWidth={2.25} />
        </span>
      ) : null}
      {!isTargeted ? <span aria-hidden="true" className="empty-cell-state__line" /> : null}
      {isTargeted ? (
        <span aria-hidden="true" className="empty-cell-state__label">
          {isReady ? 'Slipp her' : 'Opptatt'}
        </span>
      ) : null}
    </div>
  )
}

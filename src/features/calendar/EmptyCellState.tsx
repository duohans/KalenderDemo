import { CircleDashed, Plus, X } from 'lucide-react'
import { cx } from '../../lib/cx.ts'

type EmptyCellStateProps = {
  isNeedCardDragActive: boolean
  canAcceptNeedCard: boolean
}

export function EmptyCellState({
  isNeedCardDragActive,
  canAcceptNeedCard,
}: EmptyCellStateProps) {
  const isReady = isNeedCardDragActive && canAcceptNeedCard
  const isBlocked = isNeedCardDragActive && !canAcceptNeedCard
  const Icon = isNeedCardDragActive ? (canAcceptNeedCard ? Plus : X) : CircleDashed
  const label = isNeedCardDragActive ? (canAcceptNeedCard ? 'Slipp her' : 'Opptatt') : 'Tom celle'

  return (
    <div
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
    </div>
  )
}

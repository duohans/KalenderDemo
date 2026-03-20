import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronRight,
  Clock3,
  LayoutGrid,
  UserRound,
  UserCheck,
  X,
} from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import {
  selectEffectiveNeedCardAssignee,
  selectNeedCardDisplayModel,
  selectNeedCardAssignmentMode,
  selectRowCards,
  selectRowDisplayModel,
  selectRowTitle,
  selectSubstituteById,
  selectTeacherById,
} from '../../domain/schedule/selectors.ts'
import { useSchedule } from '../schedule/useSchedule.ts'
import { AssigneeBadge } from '../shared/AssigneeBadge.tsx'
import type { PlannerSelection } from './plannerSelection.ts'

type PlannerDetailSheetProps = {
  selection: PlannerSelection | null
  onClose: () => void
  onClearRowResponsible: (rowId: string) => void
  onSelectCard: (cardId: string) => void
}

function getTimeBlockLabel(timeBlockId: string | null) {
  if (!timeBlockId) {
    return 'Uten tidspunkt'
  }

  return TIME_BLOCKS.find((block) => block.id === timeBlockId)?.label ?? timeBlockId
}

export function PlannerDetailSheet({
  selection,
  onClose,
  onClearRowResponsible,
  onSelectCard,
}: PlannerDetailSheetProps) {
  const { state, dispatch } = useSchedule()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!selection) {
      return
    }

    closeButtonRef.current?.focus()
  }, [selection])

  useEffect(() => {
    if (!selection) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, selection])

  let title = ''
  let body: ReactNode = null

  if (selection?.kind === 'need-card') {
    const card = state.needCards[selection.cardId]

    if (card) {
      const displayModel = selectNeedCardDisplayModel(state, card.id)
      const teacher = selectTeacherById(state, card.sourceTeacherId)
      const effectiveAssignee = selectEffectiveNeedCardAssignee(state, card.id)
      const assignmentMode = selectNeedCardAssignmentMode(state, card.id)
      const rowTitle =
        card.placement === 'scheduled' && card.rowId ? selectRowTitle(state, card.rowId) : null

      title = card.title
      body = (
        <div className="detail-sheet__stack">
          <div className="detail-sheet__block detail-sheet__block--accent">
            <div className="detail-sheet__facts">
              <div>
                <p className="panel-kicker">Klasse</p>
                <p className="detail-sheet__lead">{displayModel?.classLabel ?? 'Ukjent'}</p>
              </div>
              <div>
                <p className="panel-kicker">Fag</p>
                <p className="detail-sheet__lead">{displayModel?.subjectLabel ?? card.title}</p>
              </div>
              <div>
                <p className="panel-kicker">Rom</p>
                <p className="detail-sheet__lead">{card.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="detail-sheet__block">
            <div className="detail-sheet__section-head">
              <UserRound aria-hidden="true" size={16} strokeWidth={2.25} />
              <p className="panel-kicker">Lærer</p>
            </div>
            <p className="detail-sheet__lead">{teacher?.name ?? 'Ukjent lærer'}</p>
          </div>

          <div className="detail-sheet__block">
            <div className="detail-sheet__section-head">
              <Clock3 aria-hidden="true" size={16} strokeWidth={2.25} />
              <p className="panel-kicker">Tid og plassering</p>
            </div>
            <div className="detail-sheet__facts">
              <div>
                <p className="panel-kicker">Tid</p>
                <p className="detail-sheet__lead">{getTimeBlockLabel(card.timeBlockId)}</p>
              </div>
              <div>
                <p className="panel-kicker">Rad</p>
                <p className="detail-sheet__lead">
                  {card.placement === 'scheduled' ? rowTitle?.compact ?? 'Rad' : 'Uplanlagt'}
                </p>
              </div>
            </div>
          </div>

          <div className="detail-sheet__block">
            <div className="detail-sheet__section-head">
              <UserCheck aria-hidden="true" size={16} strokeWidth={2.25} />
              <p className="panel-kicker">Tildeling</p>
            </div>
            <AssigneeBadge
              person={effectiveAssignee}
              mode={assignmentMode}
              labelOverride={
                assignmentMode === 'explicit'
                  ? 'Direkte tildelt'
                  : assignmentMode === 'inherited'
                    ? 'Arver fra rad'
                    : 'Ingen vikar'
              }
            />
            <p className="detail-sheet__copy">
              {assignmentMode === 'explicit'
                ? 'Kortet bruker en direkte vikar.'
                : assignmentMode === 'inherited'
                  ? 'Kortet arver raden sin vikar.'
                  : 'Kortet har ingen aktiv vikar.'}
            </p>
            {assignmentMode === 'explicit' ? (
              <button
                type="button"
                className="action-button action-button--secondary detail-sheet__action"
                onClick={() =>
                  dispatch({
                    type: 'clearNeedCardExplicitAssignee',
                    cardId: card.id,
                  })
                }
              >
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
                Fjern direkte tildeling
              </button>
            ) : null}
          </div>
        </div>
      )
    }
  }

  if (selection?.kind === 'row') {
    const row = state.rows[selection.rowId]

    if (row) {
      const rowDisplayModel = selectRowDisplayModel(state, row.id)
      const rowAssignee = selectSubstituteById(state, row.rowResponsibleId)
      const rowCards = selectRowCards(state, row.id)
      const rowTitle = selectRowTitle(state, row.id)

      title = rowTitle.compact
      body = (
        <div className="detail-sheet__stack">
          <div className="detail-sheet__block">
            <div className="detail-sheet__section-head">
              <UserCheck aria-hidden="true" size={16} strokeWidth={2.25} />
              <p className="panel-kicker">Radansvar</p>
            </div>
            <AssigneeBadge
              person={rowAssignee}
              mode={rowAssignee ? 'inherited' : 'unassigned'}
              labelOverride={rowAssignee ? 'Radansvarlig' : 'Ingen radansvarlig'}
            />
            <p className="detail-sheet__copy">
              {rowAssignee
                ? 'Kort uten direkte overstyring arver denne vikaren.'
                : 'Slipp en vikar på radoverskriften for å gi raden ansvar.'}
            </p>
            {rowAssignee ? (
              <button
                type="button"
                className="action-button action-button--secondary detail-sheet__action"
                onClick={() => onClearRowResponsible(row.id)}
              >
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
                Fjern radansvar
              </button>
            ) : null}
          </div>

          <div className="detail-sheet__block detail-sheet__block--accent">
            <div className="detail-sheet__facts">
              <div>
                <p className="panel-kicker">Visning</p>
                <p className="detail-sheet__lead">{rowTitle.full}</p>
              </div>
              <div>
                <p className="panel-kicker">Timer</p>
                <p className="detail-sheet__lead">{rowDisplayModel?.secondaryLabel ?? '0 timer'}</p>
              </div>
            </div>
          </div>

          <div className="detail-sheet__block">
            <div className="detail-sheet__section-head">
              <LayoutGrid aria-hidden="true" size={16} strokeWidth={2.25} />
              <p className="panel-kicker">Kort i raden</p>
            </div>
            {rowCards.length > 0 ? (
              <div className="detail-sheet__list">
                {rowCards.map((card) => {
                  const cardDisplayModel = selectNeedCardDisplayModel(state, card.id)

                  return (
                    <button
                      key={card.id}
                      type="button"
                      className="detail-sheet__list-item"
                      onClick={() => onSelectCard(card.id)}
                    >
                      <span className="detail-sheet__list-time">
                        {getTimeBlockLabel(card.timeBlockId)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="detail-sheet__list-title">
                          {cardDisplayModel?.classLabel ?? card.title}
                        </span>
                        <span className="detail-sheet__list-subtitle truncate">
                          {cardDisplayModel?.subjectLabel ?? card.title}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        size={16}
                        strokeWidth={2.25}
                        className="detail-sheet__list-arrow"
                      />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="detail-sheet__copy">Ingen kort er lagt i denne raden ennå.</p>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <AnimatePresence>
      {selection && body ? (
        <>
          <motion.button
            key="planner-detail-backdrop"
            type="button"
            aria-label="Lukk detaljer"
            className="planner-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={onClose}
          />
          <motion.aside
            key="planner-detail-sheet"
            role="dialog"
            aria-modal="false"
            aria-labelledby="planner-detail-title"
            className="planner-detail-sheet"
            initial={{ opacity: 0, x: 22, y: 14 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 18, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="detail-sheet__topbar">
              <div>
                <p className="panel-kicker">Detaljer</p>
                <h3 id="planner-detail-title" className="planner-heading text-[1.55rem] leading-none">
                  {title}
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="action-button action-button--secondary detail-sheet__close"
                onClick={onClose}
              >
                <X size={14} strokeWidth={2.25} aria-hidden="true" />
                Lukk
              </button>
            </div>
            {body}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  LayoutGrid,
  MoveRight,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { TIME_BLOCKS } from '../../domain/schedule/constants.ts'
import {
  selectCanPlaceNeedCardInCell,
  selectCanDropNeedCardInCell,
  selectEffectiveNeedCardAssignee,
  selectNeedCardAssignmentMode,
  selectNeedCardDisplayModel,
  selectRowCards,
  selectRowDisplayModel,
  selectRowTitle,
  selectSubstituteById,
  selectTeacherById,
} from '../../domain/schedule/selectors.ts'
import type { PlannerAction, PlannerState, TimeBlockId, WeekdayId } from '../../domain/schedule/types.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  useScheduleDispatch,
  useScheduleSelection,
  useScheduleSelectionActions,
  useScheduleState,
} from '../schedule/useSchedule.ts'

const UNSCHEDULED_ROW_ID = '__unscheduled__'

function getTimeBlockLabel(timeBlockId: string | null) {
  if (!timeBlockId) {
    return 'Uten tidspunkt'
  }

  return TIME_BLOCKS.find((block) => block.id === timeBlockId)?.label ?? timeBlockId
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return []
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('hidden'))
}

function NeedCardDetailContent({
  cardId,
  runAction,
  state,
}: {
  cardId: string
  runAction: (action: PlannerAction) => void
  state: PlannerState
}) {
  const card = state.needCards[cardId]
  const [selectedRowId, setSelectedRowId] = useState<string>(
    card?.placement === 'scheduled' && card.rowId ? card.rowId : UNSCHEDULED_ROW_ID,
  )
  const [selectedAllocatedTimeBlockId, setSelectedAllocatedTimeBlockId] = useState<TimeBlockId>(
    card?.allocatedTimeBlockId ?? TIME_BLOCKS[0].id,
  )
  const [selectedCardAssigneeId, setSelectedCardAssigneeId] = useState(
    card?.explicitAssigneeId ?? '',
  )

  useEffect(() => {
    if (!card) {
      return
    }

    setSelectedRowId(
      card.placement === 'scheduled' && card.rowId ? card.rowId : UNSCHEDULED_ROW_ID,
    )
    setSelectedAllocatedTimeBlockId(card.allocatedTimeBlockId)
    setSelectedCardAssigneeId(card.explicitAssigneeId ?? '')
  }, [
    card?.allocatedTimeBlockId,
    card?.explicitAssigneeId,
    card?.placement,
    card?.rowId,
    card?.id,
  ])

  if (!card) {
    return null
  }

  const displayModel = selectNeedCardDisplayModel(state, card.id)
  const teacher = selectTeacherById(state, card.sourceTeacherId)
  const effectiveAssignee = selectEffectiveNeedCardAssignee(state, card.id)
  const assignmentMode = selectNeedCardAssignmentMode(state, card.id)
  const rowTitle =
    card.placement === 'scheduled' && card.rowId
      ? selectRowTitle(state, card.rowId, card.dayId)
      : null
  const isMovingToUnscheduled = selectedRowId === UNSCHEDULED_ROW_ID
  const selectedCellAvailable =
    !isMovingToUnscheduled &&
    selectCanDropNeedCardInCell(
      state,
      card.id,
      selectedRowId,
      card.allocatedTimeBlockId,
      card.dayId,
    )
  const placementChanged = isMovingToUnscheduled
    ? card.placement !== 'unscheduled'
    : card.placement !== 'scheduled' || card.rowId !== selectedRowId
  const canApplyPlacement = placementChanged && (isMovingToUnscheduled || selectedCellAvailable)
  const allocatedTimeChanged = card.allocatedTimeBlockId !== selectedAllocatedTimeBlockId
  const currentRowCanKeepCardAtNextTime =
    card.placement === 'scheduled' &&
    card.rowId !== null &&
    selectCanPlaceNeedCardInCell(
      state,
      card.id,
      card.rowId,
      selectedAllocatedTimeBlockId,
      card.dayId,
    )
  const assigneeChanged = (card.explicitAssigneeId ?? '') !== selectedCardAssigneeId
  const canApplyAssignee =
    assigneeChanged && (selectedCardAssigneeId !== '' || card.explicitAssigneeId !== null)

  return (
    <>
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
            <p className="panel-kicker">Opprinnelig tid</p>
            <p className="detail-sheet__lead">
              {getTimeBlockLabel(card.allocatedTimeBlockId)}
            </p>
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
          <Clock3 aria-hidden="true" size={16} strokeWidth={2.25} />
          <p className="panel-kicker">Endre tidspunkt</p>
        </div>
        <div className="detail-sheet__controls">
          <div className="detail-sheet__field">
            <label htmlFor="detail-card-allocated-time">Tidspunkt</label>
            <select
              id="detail-card-allocated-time"
              value={selectedAllocatedTimeBlockId}
              onChange={(event) =>
                setSelectedAllocatedTimeBlockId(event.target.value as TimeBlockId)
              }
            >
              {TIME_BLOCKS.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.label}
                </option>
              ))}
            </select>
          </div>

          {!allocatedTimeChanged ? (
            <p className="detail-sheet__hint">
              Kortet kan bare planlegges i {getTimeBlockLabel(card.allocatedTimeBlockId)}.
            </p>
          ) : card.placement === 'scheduled' && card.rowId && !currentRowCanKeepCardAtNextTime ? (
            <p className="detail-sheet__hint detail-sheet__hint--danger">
              Den nye tiden er opptatt i dagens rad. Kortet sendes til Uplanlagt når du bekrefter.
            </p>
          ) : (
            <p className="detail-sheet__hint">
              Tidspunktendring bekreftes separat fra vanlig plassering.
            </p>
          )}

          <div className="detail-sheet__actions">
            <button
              type="button"
              className="action-button action-button--primary"
              disabled={!allocatedTimeChanged}
              onClick={() =>
                runAction({
                  type: 'updateNeedCardAllocatedTimeBlock',
                  cardId: card.id,
                  timeBlockId: selectedAllocatedTimeBlockId,
                })
              }
            >
              Bekreft tidspunkt
            </button>
          </div>
        </div>
      </div>

      <div className="detail-sheet__block">
        <div className="detail-sheet__section-head">
          <MoveRight aria-hidden="true" size={16} strokeWidth={2.25} />
          <p className="panel-kicker">Flytt kort</p>
        </div>
        <div className="detail-sheet__controls">
          <div className="detail-sheet__field">
            <label htmlFor="detail-card-row">Rad</label>
            <select
              id="detail-card-row"
              value={selectedRowId}
              onChange={(event) => setSelectedRowId(event.target.value)}
            >
              <option value={UNSCHEDULED_ROW_ID}>Uplanlagt</option>
              {state.rowOrder.map((rowId) => (
                <option key={rowId} value={rowId}>
                  {selectRowTitle(state, rowId, card.dayId).compact}
                </option>
              ))}
            </select>
          </div>

          <p className="detail-sheet__hint">
            Kortet kan bare lagres i tidskolonnen {getTimeBlockLabel(card.allocatedTimeBlockId)}.
          </p>

          {selectedRowId !== UNSCHEDULED_ROW_ID && !selectedCellAvailable ? (
            <p className="detail-sheet__hint detail-sheet__hint--danger">
              Den valgte raden er allerede opptatt på kortets tidspunkt.
            </p>
          ) : null}

          {selectedRowId === UNSCHEDULED_ROW_ID ? (
            <p className="detail-sheet__hint">Kortet sendes tilbake til Uplanlagt.</p>
          ) : null}

          <div className="detail-sheet__actions">
            <button
              type="button"
              className="action-button action-button--primary"
              disabled={!canApplyPlacement}
              onClick={() => {
                if (selectedRowId === UNSCHEDULED_ROW_ID) {
                  runAction({
                    type: 'moveNeedCardToUnscheduled',
                    cardId: card.id,
                  })
                  return
                }

                runAction({
                  type: 'moveNeedCardToCell',
                  cardId: card.id,
                  rowId: selectedRowId,
                  timeBlockId: card.allocatedTimeBlockId,
                })
              }}
            >
              Lagre plassering
            </button>
            <button
              type="button"
              className="action-button action-button--secondary"
              disabled={card.placement === 'unscheduled'}
              onClick={() =>
                runAction({
                  type: 'moveNeedCardToUnscheduled',
                  cardId: card.id,
                })
              }
            >
              Send til Uplanlagt
            </button>
          </div>
        </div>
      </div>

      <div className="detail-sheet__block">
        <div className="detail-sheet__section-head">
          <UserCheck aria-hidden="true" size={16} strokeWidth={2.25} />
          <p className="panel-kicker">Tildeling</p>
        </div>
        <div className="detail-sheet__controls">
          <div className="detail-sheet__field">
            <label htmlFor="detail-card-assignee">Direkte vikar</label>
            <select
              id="detail-card-assignee"
              value={selectedCardAssigneeId}
              onChange={(event) => setSelectedCardAssigneeId(event.target.value)}
            >
              <option value="">Ingen direkte tildeling</option>
              {state.substituteOrder.map((substituteId) => (
                <option key={substituteId} value={substituteId}>
                  {state.substitutes[substituteId].name}
                </option>
              ))}
            </select>
          </div>

          <p className="detail-sheet__hint">
            {assignmentMode === 'explicit'
              ? 'Kortet bruker en direkte vikar.'
              : assignmentMode === 'inherited'
                ? 'Kortet arver raden sin vikar.'
                : 'Kortet har ingen aktiv vikar.'}
          </p>

          <div className="detail-sheet__actions">
            <button
              type="button"
              className="action-button action-button--primary"
              disabled={!canApplyAssignee}
              onClick={() => {
                if (selectedCardAssigneeId) {
                  runAction({
                    type: 'assignSubstituteToNeedCard',
                    cardId: card.id,
                    substituteId: selectedCardAssigneeId,
                  })
                  return
                }

                runAction({
                  type: 'clearNeedCardExplicitAssignee',
                  cardId: card.id,
                })
              }}
            >
              Lagre tildeling
            </button>
            <button
              type="button"
              className="action-button action-button--secondary"
              disabled={!card.explicitAssigneeId}
              onClick={() =>
                runAction({
                  type: 'clearNeedCardExplicitAssignee',
                  cardId: card.id,
                })
              }
            >
              Fjern direkte tildeling
            </button>
          </div>

          <p className="detail-sheet__hint">
            Aktiv vikar: {effectiveAssignee?.name ?? 'Ingen vikar'}
          </p>
        </div>
      </div>
    </>
  )
}

function RowDetailContent({
  closeSelection,
  openSelection,
  dayId,
  rowId,
  runAction,
  state,
}: {
  closeSelection: () => void
  openSelection: (selection: { kind: 'need-card'; cardId: string }) => void
  dayId: WeekdayId
  rowId: string
  runAction: (action: PlannerAction) => void
  state: PlannerState
}) {
  const row = state.rows[rowId]
  const [selectedRowAssigneeId, setSelectedRowAssigneeId] = useState(row?.rowResponsibleId ?? '')

  if (!row) {
    return null
  }

  const rowDisplayModel = selectRowDisplayModel(state, row.id, dayId)
  const rowAssignee = selectSubstituteById(state, row.rowResponsibleId)
  const rowCards = selectRowCards(state, row.id, dayId)
  const rowTitle = selectRowTitle(state, row.id, dayId)
  const rowAssigneeChanged = (row.rowResponsibleId ?? '') !== selectedRowAssigneeId
  const canApplyRowAssignee =
    rowAssigneeChanged && (selectedRowAssigneeId !== '' || row.rowResponsibleId !== null)

  return (
    <>
      <div className="detail-sheet__block">
        <div className="detail-sheet__section-head">
          <UserCheck aria-hidden="true" size={16} strokeWidth={2.25} />
          <p className="panel-kicker">Radansvar</p>
        </div>
        <div className="detail-sheet__controls">
          <div className="detail-sheet__field">
            <label htmlFor="detail-row-assignee">Vikar</label>
            <select
              id="detail-row-assignee"
              value={selectedRowAssigneeId}
              onChange={(event) => setSelectedRowAssigneeId(event.target.value)}
            >
              <option value="">Ingen radansvarlig</option>
              {state.substituteOrder.map((substituteId) => (
                <option key={substituteId} value={substituteId}>
                  {state.substitutes[substituteId].name}
                </option>
              ))}
            </select>
          </div>

          <p className="detail-sheet__hint">
            {rowAssignee
              ? 'Kort uten direkte overstyring arver denne vikaren.'
              : 'Velg en vikar for å gi raden standardansvar.'}
          </p>

          <div className="detail-sheet__actions">
            <button
              type="button"
              className="action-button action-button--primary"
              disabled={!canApplyRowAssignee}
              onClick={() => {
                if (selectedRowAssigneeId) {
                  runAction({
                    type: 'assignSubstituteToRow',
                    rowId: row.id,
                    substituteId: selectedRowAssigneeId,
                  })
                  return
                }

                runAction({
                  type: 'clearRowResponsible',
                  rowId: row.id,
                })
              }}
            >
              Lagre radansvar
            </button>
            <button
              type="button"
              className="action-button action-button--secondary"
              disabled={!row.rowResponsibleId}
              onClick={() =>
                runAction({
                  type: 'clearRowResponsible',
                  rowId: row.id,
                })
              }
            >
              Fjern radansvar
            </button>
            <button
              type="button"
              className="action-button action-button--outline"
              onClick={() => {
                runAction({
                  type: 'removeRow',
                  rowId: row.id,
                })
                closeSelection()
              }}
            >
              Fjern rad
            </button>
          </div>
        </div>
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
                  onClick={() => openSelection({ kind: 'need-card', cardId: card.id })}
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
    </>
  )
}

type PlannerDetailSheetProps = {
  viewMode?: 'day' | 'week'
  onOpenNeedCardInDayView?: (cardId: string) => void
}

export function PlannerDetailSheet({
  viewMode = 'day',
  onOpenNeedCardInDayView,
}: PlannerDetailSheetProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const selection = useScheduleSelection()
  const dispatch = useScheduleDispatch()
  const { closeSelection, openSelection } = useScheduleSelectionActions()
  const { pushMotionEvent } = usePlannerDragFeedback()
  const sheetRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const hadSelectionRef = useRef(false)

  const runAction = (action: PlannerAction) => {
    pushMotionEvent(action)
    dispatch(action)
  }

  useEffect(() => {
    if (selection && !hadSelectionRef.current) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
    }

    if (!selection && hadSelectionRef.current) {
      previousFocusRef.current?.focus()
      previousFocusRef.current = null
    }

    hadSelectionRef.current = Boolean(selection)
  }, [selection])

  useEffect(() => {
    if (!selection || !sheetRef.current) {
      return
    }

    const sheet = sheetRef.current
    const frame = window.requestAnimationFrame(() => {
      const focusable = getFocusableElements(sheet)
      ;(focusable[0] ?? sheet).focus()
    })
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSelection()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusableElements(sheet)

      if (focusable.length === 0) {
        event.preventDefault()
        sheet.focus()
        return
      }

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeSelection, selection])

  const title =
    selection?.kind === 'need-card'
        ? state.needCards[selection.cardId]?.title ?? ''
      : selection?.kind === 'row'
        ? selectRowTitle(state, selection.rowId, selection.dayId).compact
        : ''

  if (!selection) {
    return null
  }

  const canOpenInDayView =
    viewMode === 'week' &&
    selection.kind === 'need-card' &&
    typeof onOpenNeedCardInDayView === 'function'

  return (
    <>
      <button
        type="button"
        aria-label="Lukk detaljer"
        className="planner-detail-backdrop"
        onClick={closeSelection}
      />
      <aside
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-detail-title"
        className="planner-detail-sheet"
        tabIndex={-1}
      >
        <div className="detail-sheet__topbar">
          <div>
            <p className="panel-kicker">Detaljer</p>
            <h3 id="planner-detail-title" className="planner-heading text-[1.55rem] leading-none">
              {title}
            </h3>
          </div>
          <div className="detail-sheet__topbar-actions">
            {canOpenInDayView ? (
              <button
                type="button"
                className="action-button action-button--outline detail-sheet__open-day"
                onClick={() => onOpenNeedCardInDayView(selection.cardId)}
              >
                <CalendarDays size={14} strokeWidth={2.25} aria-hidden="true" />
                Åpne i dagvisning
              </button>
            ) : null}
            <button
              type="button"
              className="action-button action-button--secondary detail-sheet__close"
              onClick={closeSelection}
            >
              <X size={14} strokeWidth={2.25} aria-hidden="true" />
              Lukk
            </button>
          </div>
        </div>
        <div className="detail-sheet__stack">
          {selection.kind === 'need-card' ? (
            <NeedCardDetailContent
              key={selection.cardId}
              cardId={selection.cardId}
              runAction={runAction}
              state={state}
            />
          ) : (
            <RowDetailContent
              key={selection.rowId}
              closeSelection={closeSelection}
              openSelection={openSelection}
              dayId={selection.dayId}
              rowId={selection.rowId}
              runAction={runAction}
              state={state}
            />
          )}
        </div>
      </aside>
    </>
  )
}

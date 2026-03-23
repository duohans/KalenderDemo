import {
  ArrowDownLeft,
  CalendarDays,
  Columns3,
  Minus,
  Pin,
  TriangleAlert,
} from 'lucide-react'
import type { CSSProperties, KeyboardEvent } from 'react'

import { selectWeekGridViewModel } from '../../domain/schedule/selectors.ts'
import type { TimeBlockId, WeekdayId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'

const MAX_VISIBLE_CARDS = 3

const iconByTone = {
  explicit: Pin,
  inherited: ArrowDownLeft,
  unassigned: Minus,
  conflict: TriangleAlert,
} as const

type WeekViewProps = {
  selectedDayId: WeekdayId
  onOpenDay: (dayId: WeekdayId, timeBlockId?: TimeBlockId) => void
  onOpenCard: (dayId: WeekdayId, cardId: string) => void
}

function onActionKeyDown(
  event: KeyboardEvent<HTMLElement>,
  callback: () => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()
  callback()
}

export function WeekView({
  selectedDayId,
  onOpenDay,
  onOpenCard,
}: WeekViewProps) {
  const weekGrid = useScheduleState(selectWeekGridViewModel)

  return (
    <section
      aria-label="Ukeoversikt"
      className="planner-stage planner-stage--week order-2 flex min-h-0 flex-1 flex-col gap-2.5"
    >
      <div className="planner-grid-frame relative flex min-h-0 flex-1 flex-col">
        <div className="planner-stage__header">
          <div className="planner-stage__heading">
            <p className="panel-kicker">Oversikt</p>
            <h2 className="planner-stage__title planner-heading">Ukeoversikt</h2>
          </div>
          <div className="planner-stage__chips">
            <span className="planner-chip planner-chip--board">
              <CalendarDays size={15} strokeWidth={2.1} aria-hidden="true" />
              Mandag til fredag
            </span>
            <span className="planner-chip planner-chip--board">
              <Columns3 size={15} strokeWidth={2.1} aria-hidden="true" />
              {weekGrid.rows.length} tidsblokker
            </span>
          </div>
        </div>

        <div className="planner-grid-scroll planner-grid-scroll--week flex-1">
          <div className="week-board w-full">
            <div className="week-board__header-grid">
              <div className="week-board__time-spacer">
                <p className="calendar-header-spacer__title">Tid</p>
              </div>
              {weekGrid.days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  className={cx(
                    'week-board__day-header',
                    day.id === selectedDayId && 'week-board__day-header--selected',
                  )}
                  onClick={() => onOpenDay(day.id)}
                >
                  <span className="panel-kicker week-board__day-kicker">
                    {day.shortLabel}
                  </span>
                  <span className="week-board__day-label">{day.label}</span>
                </button>
              ))}
            </div>

            <div className="week-board__rows">
              {weekGrid.rows.map((row, rowIndex) => {
                const rowTone = rowIndex % 2 === 0 ? 'odd' : 'even'

                return (
                  <div key={row.timeBlock.id} className="week-board__row-grid">
                    <div className="week-board__time-cell" data-row-tone={rowTone}>
                      <span className="week-board__time-start">{row.timeBlock.start}</span>
                      <span className="week-board__time-end">{row.timeBlock.end}</span>
                    </div>

                    {row.cells.map((cell) => {
                      const visibleCards = cell.cards.slice(0, MAX_VISIBLE_CARDS)
                      const hiddenCount = Math.max(0, cell.cards.length - visibleCards.length)
                      const dayLabel =
                        weekGrid.days.find((day) => day.id === cell.dayId)?.label ?? cell.dayId

                      return (
                        <div
                          key={`${cell.dayId}-${cell.timeBlockId}`}
                          role="button"
                          tabIndex={0}
                          className={cx(
                            'week-board__cell',
                            cell.dayId === selectedDayId && 'week-board__cell--selected',
                          )}
                          data-row-tone={rowTone}
                          aria-label={`Åpne ${dayLabel} ${row.timeBlock.label} i dagvisning`}
                          onClick={() => onOpenDay(cell.dayId, cell.timeBlockId)}
                          onKeyDown={(event) =>
                            onActionKeyDown(event, () => onOpenDay(cell.dayId, cell.timeBlockId))
                          }
                        >
                          {visibleCards.length > 0 ? (
                            <div
                              className="week-board__stack"
                              data-visible-count={visibleCards.length}
                              data-has-overflow={hiddenCount > 0}
                            >
                              {visibleCards.map((card) => (
                                (() => {
                                  const StatusIcon = iconByTone[card.statusTone]

                                  return (
                                    <button
                                      key={card.cardId}
                                      type="button"
                                      className={cx(
                                        'week-mini-card',
                                        `week-mini-card--${card.statusTone}`,
                                      )}
                                      style={
                                        {
                                          ['--week-card-accent' as string]: card.accentColor,
                                          ['--week-card-teacher-accent' as string]:
                                            card.teacherAccent,
                                          ['--week-card-assignee-accent' as string]:
                                            card.assigneeAccent,
                                        } as CSSProperties
                                      }
                                      aria-label={`Åpne detaljer for ${card.subjectLabel} ${card.classLabel}`}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        onOpenCard(cell.dayId, card.cardId)
                                      }}
                                    >
                                      <span aria-hidden="true" className="week-mini-card__band" />
                                      <span className="week-mini-card__head">
                                        <span
                                          className="week-mini-card__teacher-avatar"
                                          title={card.teacherName}
                                        >
                                          {card.teacherAvatarInitials}
                                        </span>
                                        <span className="week-mini-card__status-mark">
                                          <StatusIcon size={11} strokeWidth={2.2} />
                                        </span>
                                      </span>
                                      <span className="week-mini-card__body">
                                        <span className="week-mini-card__class">
                                          {card.classLabel}
                                        </span>
                                        <span className="week-mini-card__subject">
                                          {card.subjectLabel}
                                        </span>
                                      </span>
                                      <span
                                        className={cx(
                                          'week-mini-card__assignee-chip',
                                          !card.assigneeAvatarInitials &&
                                            'week-mini-card__assignee-chip--empty',
                                        )}
                                      >
                                        <span
                                          className={cx(
                                            'week-mini-card__assignee-avatar',
                                            !card.assigneeAvatarInitials &&
                                              'week-mini-card__assignee-avatar--empty',
                                          )}
                                        >
                                          {card.assigneeAvatarInitials ?? (
                                            <StatusIcon size={10} strokeWidth={2.25} />
                                          )}
                                        </span>
                                        <span className="week-mini-card__assignee">
                                          {card.assigneeLabel}
                                        </span>
                                      </span>
                                    </button>
                                  )
                                })()
                              ))}
                              {hiddenCount > 0 ? (
                                <span
                                  className="week-mini-card__more"
                                  aria-label={`${hiddenCount} flere planlagte timer i denne ruten`}
                                >
                                  +{hiddenCount}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="week-board__empty" aria-hidden="true" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

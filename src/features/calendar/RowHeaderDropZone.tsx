import { useDroppable } from '@dnd-kit/core'
import { LayoutGrid, UserCheck, UserPlus, X } from 'lucide-react'
import type { CSSProperties } from 'react'

import { canDropOnTarget, type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectRowDisplayModel } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  useScheduleDispatch,
  useScheduleSelection,
  useScheduleSelectionActions,
  useScheduleState,
} from '../schedule/useSchedule.ts'

type RowHeaderDropZoneProps = {
  rowId: string
  activeDrag: PlannerDragItem | null
}

export function RowHeaderDropZone({
  rowId,
  activeDrag,
}: RowHeaderDropZoneProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const selection = useScheduleSelection()
  const dispatch = useScheduleDispatch()
  const { openSelection } = useScheduleSelectionActions()
  const { pushMotionEvent } = usePlannerDragFeedback()

  const { isOver, setNodeRef } = useDroppable({
    id: `row-header:${rowId}`,
    data: {
      type: 'row-header',
      rowId,
    },
  })

  const displayModel = selectRowDisplayModel(state, rowId)

  if (!displayModel) {
    return null
  }

  const { responsible, teachers, title } = displayModel
  const visibleTeachers = teachers.slice(0, 2)
  const hiddenTeacherCount = Math.max(0, teachers.length - visibleTeachers.length)
  const canAcceptSubstitute =
    activeDrag?.type === 'substitute' &&
    canDropOnTarget(state, activeDrag, { type: 'row-header', rowId })
  const dropHintLabel = canAcceptSubstitute && isOver ? 'Slipp vikar her' : 'Tildel vikar'
  const DropHintIcon = canAcceptSubstitute && isOver ? UserCheck : UserPlus
  const isSelected = selection?.kind === 'row' && selection.rowId === rowId

  return (
    <div
      ref={setNodeRef}
      className={cx(
        'row-header-dropzone',
        responsible && 'row-header-dropzone--owned',
        canAcceptSubstitute && 'drop-target-ready',
        canAcceptSubstitute && isOver && 'drop-target-valid',
        isSelected && 'selection-active',
      )}
      style={{ ['--row-accent' as string]: displayModel.rowAccent } as CSSProperties}
      aria-label={`Tildel vikar til ${title.full}`}
    >
      {displayModel.canClearResponsible ? (
        <button
          type="button"
          className="row-header__corner-clear"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            pushMotionEvent({ type: 'clearRowResponsible', rowId })
            dispatch({ type: 'clearRowResponsible', rowId })
          }}
          aria-label="Fjern radansvarlig"
        >
          <X size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="button"
        className="row-header-button"
        onClick={() => openSelection({ kind: 'row', rowId })}
        aria-haspopup="dialog"
        aria-expanded={isSelected}
        aria-label={`Åpne detaljer for ${title.full}`}
      >
        <div className="row-header__main">
          <div className="row-header__avatar-shell">
            {responsible ? (
              <span className="row-header__avatar" title={responsible.name}>
                {responsible.avatarInitials}
              </span>
            ) : (
              <span className="row-header__avatar row-header__avatar--ghost">
                <UserPlus aria-hidden="true" size={16} strokeWidth={2.25} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="row-header__title" title={title.full}>
              {title.compact}
            </h3>
          </div>
        </div>

        <div className="row-header__footer">
          <div className="teacher-pill-list" aria-hidden="true">
            {visibleTeachers.map((teacher) => (
              <span
                key={teacher.id}
                className="teacher-pill"
                title={teacher.name}
              >
                <span
                  className="teacher-pill__avatar"
                  style={{ backgroundColor: teacher.accentColor }}
                >
                  {teacher.avatarInitials}
                </span>
                <span className="teacher-pill__label">{teacher.name.split(' ')[0]}</span>
              </span>
            ))}
            {hiddenTeacherCount > 0 ? (
              <span className="teacher-pill teacher-pill--more">+{hiddenTeacherCount}</span>
            ) : null}
            {teachers.length === 0 ? (
              <span className="teacher-pill teacher-pill--empty">
                <LayoutGrid aria-hidden="true" size={12} strokeWidth={2.25} />
              </span>
            ) : null}
          </div>

          <div className="row-header__actions">
            <span
              className={cx(
                'row-drop-hint',
                responsible && 'row-drop-hint--owned',
                canAcceptSubstitute && 'row-drop-hint--ready',
                canAcceptSubstitute && isOver && 'row-drop-hint--active',
              )}
              title={dropHintLabel}
              aria-label={dropHintLabel}
            >
              <DropHintIcon aria-hidden="true" size={14} strokeWidth={2.25} />
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

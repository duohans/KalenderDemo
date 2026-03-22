import { useCallback, useEffect, useRef, useState } from 'react'

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type {
  PlannerMotionEvent,
  PlannerMotionEventBase,
  RejectedDrag,
} from './PlannerDragFeedbackContext.tsx'

const FEEDBACK_DISMISS_MS = 1000

export function useDragFeedbackTimers() {
  const [recentEvent, setRecentEvent] = useState<PlannerMotionEvent | null>(null)
  const [rejectedDrag, setRejectedDrag] = useState<RejectedDrag | null>(null)
  const feedbackSequenceRef = useRef(0)
  const recentEventTimerRef = useRef<number | null>(null)
  const rejectedDragTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (recentEventTimerRef.current !== null) {
        window.clearTimeout(recentEventTimerRef.current)
      }

      if (rejectedDragTimerRef.current !== null) {
        window.clearTimeout(rejectedDragTimerRef.current)
      }
    }
  }, [])

  const pushMotionEvent = useCallback(
    (event: PlannerMotionEventBase) => {
      const key = ++feedbackSequenceRef.current
      const nextEvent: PlannerMotionEvent = { ...event, key }

      if (recentEventTimerRef.current !== null) {
        window.clearTimeout(recentEventTimerRef.current)
      }

      setRecentEvent(nextEvent)
      recentEventTimerRef.current = window.setTimeout(() => {
        setRecentEvent((current) => (current?.key === key ? null : current))
        recentEventTimerRef.current = null
      }, FEEDBACK_DISMISS_MS)
    },
    [],
  )

  const pushRejectedDrag = useCallback(
    (item: PlannerDragItem) => {
      const key = ++feedbackSequenceRef.current

      if (rejectedDragTimerRef.current !== null) {
        window.clearTimeout(rejectedDragTimerRef.current)
      }

      setRejectedDrag({ item, key })
      rejectedDragTimerRef.current = window.setTimeout(() => {
        setRejectedDrag((current) => (current?.key === key ? null : current))
        rejectedDragTimerRef.current = null
      }, FEEDBACK_DISMISS_MS)
    },
    [],
  )

  return {
    pushMotionEvent,
    pushRejectedDrag,
    recentEvent,
    rejectedDrag,
  }
}

import {
  defaultDropAnimationSideEffects,
  type DropAnimationFunction,
  type DropAnimation,
} from '@dnd-kit/core'
import { CSS, type Transform } from '@dnd-kit/utilities'
import type { TargetAndTransition, Transition } from 'framer-motion'

export type DragVector = {
  x: number
  y: number
}

type TargetActivationKind = 'row' | 'need-card' | 'cell'
type RejectKind = 'need-card' | 'substitute'
type ReceiveKind = 'row' | 'card' | 'badge'
type OverlayKind = 'need-card' | 'substitute'
export type PlannerDropAnimationKind = 'valid' | 'invalid'

type TargetActivationState = {
  ready: boolean
  active: boolean
  invalid?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function overlayRotation(vector: DragVector, maxRotation: number) {
  return clamp(vector.x * 0.035 + vector.y * 0.012, -maxRotation, maxRotation)
}

function interpolateDropTransform(
  from: Transform,
  to: Transform,
  translateProgress: number,
  scaleProgress: number,
): Transform {
  return {
    x: from.x + (to.x - from.x) * translateProgress,
    y: from.y + (to.y - from.y) * translateProgress,
    scaleX: from.scaleX + (to.scaleX - from.scaleX) * scaleProgress,
    scaleY: from.scaleY + (to.scaleY - from.scaleY) * scaleProgress,
  }
}

function interpolateTranslateTransform(
  from: Transform,
  to: Transform,
  progress: number,
): Transform {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
    scaleX: 1,
    scaleY: 1,
  }
}

function toScaleTransform(scaleX: number, scaleY: number, translateY = 0) {
  return `translate3d(0px, ${translateY}px, 0px) scale(${scaleX}, ${scaleY}) rotate(0deg)`
}

function getDefaultDropKeyframes(initial: Transform, final: Transform, reduceMotion: boolean) {
  const initialTransform = CSS.Transform.toString(initial)
  const finalTransform = CSS.Transform.toString(final)

  if (reduceMotion) {
    const midTransform = CSS.Transform.toString(
      interpolateDropTransform(initial, final, 0.62, 0.8),
    )

    return [
      {
        opacity: 1,
        offset: 0,
        transform: initialTransform,
      },
      {
        opacity: 1,
        offset: 0.56,
        transform: midTransform,
      },
      {
        opacity: 1,
        offset: 1,
        transform: finalTransform,
      },
    ]
  }

  return [
    {
      opacity: 1,
      offset: 0,
      transform: initialTransform,
    },
    {
      opacity: 1,
      offset: 0.18,
      transform: CSS.Transform.toString(
        interpolateDropTransform(initial, final, 0.1, 0.24),
      ),
    },
    {
      opacity: 1,
      offset: 0.38,
      transform: CSS.Transform.toString(
        interpolateDropTransform(initial, final, 0.3, 0.54),
      ),
    },
    {
      opacity: 1,
      offset: 0.62,
      transform: CSS.Transform.toString(
        interpolateDropTransform(initial, final, 0.58, 0.8),
      ),
    },
    {
      opacity: 1,
      offset: 0.82,
      transform: CSS.Transform.toString(
        interpolateDropTransform(initial, final, 0.82, 0.94),
      ),
    },
    {
      opacity: 1,
      offset: 1,
      transform: finalTransform,
    },
  ]
}

function getCardWrapperStretchKeyframes(
  currentTransform: string,
  finalScaleX: number,
  finalScaleY: number,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    return [
      {
        offset: 0,
        transform: currentTransform,
      },
      {
        offset: 0.54,
        transform: toScaleTransform(
          1 + (finalScaleX - 1) * 0.72,
          1 + (finalScaleY - 1) * 0.72,
          -0.5,
        ),
      },
      {
        offset: 1,
        transform: toScaleTransform(finalScaleX, finalScaleY, 0),
      },
    ]
  }

  return [
    {
      offset: 0,
      transform: currentTransform,
    },
    {
      offset: 0.14,
      transform: toScaleTransform(
        1 + (finalScaleX - 1) * 0.18,
        1 + (finalScaleY - 1) * 0.28,
        -1.25,
      ),
    },
    {
      offset: 0.34,
      transform: toScaleTransform(
        1 + (finalScaleX - 1) * 0.44,
        1 + (finalScaleY - 1) * 0.56,
        -0.8,
      ),
    },
    {
      offset: 0.6,
      transform: toScaleTransform(
        1 + (finalScaleX - 1) * 0.74,
        1 + (finalScaleY - 1) * 0.82,
        -0.28,
      ),
    },
    {
      offset: 0.82,
      transform: toScaleTransform(
        1 + (finalScaleX - 1) * 0.92,
        1 + (finalScaleY - 1) * 0.95,
        -0.08,
      ),
    },
    {
      offset: 1,
      transform: toScaleTransform(finalScaleX, finalScaleY, 0),
    },
  ]
}

function createValidNeedCardDropAnimation(
  reduceMotion: boolean,
): DropAnimationFunction {
  const duration = getPlannerDropAnimationDuration('valid', reduceMotion)
  const easing = 'cubic-bezier(0.16, 0.94, 0.22, 1)'
  const shellEasing = 'cubic-bezier(0.18, 0.92, 0.22, 1)'
  const sideEffects = defaultDropAnimationSideEffects({
    className: {
      active: 'planner-drop-source-settling',
      dragOverlay: 'planner-drop-overlay-settling',
    },
  })

  return ({ active, dragOverlay, transform, ...rest }) => {
    const delta = {
      x: dragOverlay.rect.left - active.rect.left,
      y: dragOverlay.rect.top - active.rect.top,
    }
    const scale = {
      scaleX:
        transform.scaleX !== 1
          ? (active.rect.width * transform.scaleX) / dragOverlay.rect.width
          : 1,
      scaleY:
        transform.scaleY !== 1
          ? (active.rect.height * transform.scaleY) / dragOverlay.rect.height
          : 1,
    }
    const finalTransform = {
      x: transform.x - delta.x,
      y: transform.y - delta.y,
      ...scale,
    }
    const cleanup = sideEffects({ active, dragOverlay, ...rest })
    const cardWrapper = dragOverlay.node.querySelector('.drag-overlay-card--card') as
      | HTMLElement
      | null

    if (!cardWrapper) {
      const animation = dragOverlay.node.animate(
        getDefaultDropKeyframes(transform, finalTransform, reduceMotion),
        {
          duration,
          easing,
          fill: 'forwards',
        },
      )

      return new Promise<void>((resolve) => {
        animation.onfinish = () => {
          cleanup?.()
          resolve()
        }
      })
    }

    const translateAnimation = dragOverlay.node.animate(
      [
        {
          opacity: 1,
          offset: 0,
          transform: CSS.Transform.toString({
            x: transform.x,
            y: transform.y,
            scaleX: 1,
            scaleY: 1,
          }),
        },
        {
          opacity: 1,
          offset: reduceMotion ? 0.62 : 0.48,
          transform: CSS.Transform.toString(
            interpolateTranslateTransform(transform, finalTransform, reduceMotion ? 0.64 : 0.54),
          ),
        },
        {
          opacity: 1,
          offset: reduceMotion ? 0.86 : 0.8,
          transform: CSS.Transform.toString(
            interpolateTranslateTransform(transform, finalTransform, reduceMotion ? 0.9 : 0.86),
          ),
        },
        {
          opacity: 1,
          offset: 1,
          transform: CSS.Transform.toString({
            x: finalTransform.x,
            y: finalTransform.y,
            scaleX: 1,
            scaleY: 1,
          }),
        },
      ],
      {
        duration,
        easing,
        fill: 'forwards',
      },
    )

    const currentCardTransform = getComputedStyle(cardWrapper).transform
    cardWrapper.animate(
      getCardWrapperStretchKeyframes(
        currentCardTransform === 'none'
          ? toScaleTransform(1, 1, reduceMotion ? -0.5 : -1.4)
          : currentCardTransform,
        finalTransform.scaleX,
        finalTransform.scaleY,
        reduceMotion,
      ),
      {
        duration,
        easing: shellEasing,
        fill: 'forwards',
      },
    )

    return new Promise<void>((resolve) => {
      translateAnimation.onfinish = () => {
        cleanup?.()
        resolve()
      }
    })
  }
}

export const plannerLayoutSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.78,
}

export const plannerHoverSpring: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
  mass: 0.62,
}

export const plannerTargetSpring: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.66,
}

export const plannerReceiveSpring: Transition = {
  type: 'spring',
  stiffness: 560,
  damping: 31,
  mass: 0.62,
}

export const plannerPickupSpring: Transition = {
  type: 'spring',
  stiffness: 360,
  damping: 28,
  mass: 0.74,
}

export const plannerPulseTransition: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
  times: [0, 0.58, 1],
}

export const plannerRejectTransition: Transition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
  times: [0, 0.24, 0.56, 0.82, 1],
}

export function getOverlayDragAnimation(
  kind: OverlayKind,
  vector: DragVector,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    return {
      scale: kind === 'substitute' ? 1.03 : 1.012,
      x: 0,
      y: kind === 'substitute' ? -6 : -3,
      rotate: 0,
    }
  }

  return {
    scale: kind === 'substitute' ? 1.06 : 1.026,
    x: clamp(vector.x * 0.022, -6, 6),
    y: kind === 'substitute' ? -10 : -5,
    rotate: overlayRotation(vector, kind === 'substitute' ? 5.5 : 2.6),
  }
}

export function getOverlayRestAnimation(
  kind: OverlayKind,
  reduceMotion: boolean,
): TargetAndTransition {
  return {
    scale: 1,
    x: 0,
    y: kind === 'substitute' ? (reduceMotion ? -1 : -2) : 0,
    rotate: 0,
  }
}

export function getTargetActivationAnimation(
  kind: TargetActivationKind,
  state: TargetActivationState,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    if (state.active) {
      return { scale: 1.01, x: 0, y: 0 }
    }

    return { scale: 1, x: 0, y: 0 }
  }

  if (state.invalid) {
    return {
      scale: 0.994,
      x: kind === 'cell' ? -1.5 : 0,
      y: 0,
    }
  }

  if (state.active) {
    return {
      scale: kind === 'row' ? 1.018 : kind === 'need-card' ? 1.024 : 1.02,
      x: kind === 'row' ? 1.6 : 0,
      y: kind === 'row' ? -2.5 : -1.5,
    }
  }

  if (state.ready) {
    return {
      scale: kind === 'row' ? 1.008 : 1.012,
      x: 0,
      y: -0.8,
    }
  }

  return {
    scale: 1,
    x: 0,
    y: 0,
  }
}

export function getReceiveAnimation(
  kind: ReceiveKind,
  isActive: boolean,
  reduceMotion: boolean,
): TargetAndTransition {
  if (!isActive) {
    return { scale: 1, x: 0, y: 0, opacity: 1, rotate: 0 }
  }

  if (reduceMotion) {
    return { scale: 1.01, x: 0, y: 0, opacity: 1, rotate: 0 }
  }

  if (kind === 'row') {
    return {
      scale: [1, 1.06, 1],
      x: [0, 1.5, 0],
      y: [0, -4, 0],
      opacity: [0.82, 1, 1],
      rotate: [0, -1.8, 0],
    }
  }

  if (kind === 'badge') {
    return {
      scale: [0.84, 1.12, 1],
      x: [8, 0, 0],
      y: [-4, 0, 0],
      opacity: [0.7, 1, 1],
      rotate: [-4, 0, 0],
    }
  }

  return {
    scale: [0.96, 1.03, 1],
    x: [0, 0, 0],
    y: [4, -2, 0],
    opacity: [0.8, 1, 1],
    rotate: [0.6, 0, 0],
  }
}

export function getRejectAnimation(
  kind: RejectKind,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    return {
      scale: [1, 0.995, 1],
      x: [0, -2, 0],
      y: 0,
      rotate: 0,
    }
  }

  return {
    scale: kind === 'substitute' ? [1, 1.02, 0.996, 1] : [1, 1.012, 0.996, 1],
    x: kind === 'substitute' ? [0, -8, 6, -2, 0] : [0, -6, 4, -2, 0],
    y: [0, -1, 0, 0, 0],
    rotate:
      kind === 'substitute' ? [0, -1.4, 0.8, -0.3, 0] : [0, -1, 0.6, -0.2, 0],
  }
}

export function getSourceGhostAnimation(
  isDragging: boolean,
  reduceMotion: boolean,
): TargetAndTransition {
  if (!isDragging) {
    return {
      opacity: 0,
      scale: 0.98,
    }
  }

  if (reduceMotion) {
    return {
      opacity: 1,
      scale: 1,
    }
  }

  return {
    opacity: 1,
    scale: 1,
  }
}

export function getPlannerDropAnimationDuration(
  kind: PlannerDropAnimationKind,
  reduceMotion: boolean,
) {
  if (kind === 'invalid') {
    return reduceMotion ? 160 : 210
  }

  return reduceMotion ? 210 : 360
}

export function getPlannerDropHandoffDuration(reduceMotion: boolean) {
  return getPlannerDropAnimationDuration('valid', reduceMotion)
}

export function getPlannerDropAnimation(
  kind: PlannerDropAnimationKind,
  reduceMotion: boolean,
): DropAnimation {
  if (kind === 'invalid') {
    return {
      duration: getPlannerDropAnimationDuration(kind, reduceMotion),
      easing: 'cubic-bezier(0.2, 0.92, 0.28, 1)',
      sideEffects: defaultDropAnimationSideEffects({
        className: {
          active: 'planner-drop-source-settling',
          dragOverlay: 'planner-drop-overlay-settling',
        },
      }),
    }
  }

  return createValidNeedCardDropAnimation(reduceMotion)
}

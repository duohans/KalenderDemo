import { expect, test, type Locator, type Page } from '@playwright/test'

import { STORAGE_KEY } from '../src/domain/schedule/constants.ts'
import { createSeedPlannerState } from '../src/domain/schedule/seed.ts'

test.use({
  viewport: {
    width: 1600,
    height: 1200,
  },
})

async function dragTo(page: Page, source: Locator, target: Locator) {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('Missing source or target box for drag operation.')
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 8,
    sourceBox.y + sourceBox.height / 2 + 8,
    { steps: 4 },
  )
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 20 },
  )
  const settledTargetBox = await target.boundingBox()

  if (!settledTargetBox) {
    throw new Error('Missing refreshed target box for drag operation.')
  }

  await page.mouse.move(
    settledTargetBox.x + settledTargetBox.width / 2,
    settledTargetBox.y + settledTargetBox.height / 2,
    { steps: 6 },
  )
  await page.mouse.up()
}

async function openFreshPlanner(page: Page) {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
}

function createMultiPageRailState() {
  const state = createSeedPlannerState()

  state.needCards['card-ekstra-10x'] = {
    id: 'card-ekstra-10x',
    title: 'Ekstrafag 10X',
    subtitle: 'Rom 410',
    sourceTeacherId: 'teacher-petter',
    dayId: 'monday',
    allocatedTimeBlockId: '08:30',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#d9d6ff',
  }
  state.needCards['card-ekstra-11z'] = {
    id: 'card-ekstra-11z',
    title: 'Ekstrafag 11Z',
    subtitle: 'Rom 411',
    sourceTeacherId: 'teacher-line',
    dayId: 'monday',
    allocatedTimeBlockId: '09:30',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#ffd9c2',
  }
  state.needCards['card-ekstra-12y'] = {
    id: 'card-ekstra-12y',
    title: 'Ekstrafag 12Y',
    subtitle: 'Rom 412',
    sourceTeacherId: 'teacher-camilla',
    dayId: 'monday',
    allocatedTimeBlockId: '11:30',
    placement: 'unscheduled',
    rowId: null,
    timeBlockId: null,
    explicitAssigneeId: null,
    accentColor: '#d7f0c8',
  }
  state.needCardOrder.push('card-ekstra-10x', 'card-ekstra-11z', 'card-ekstra-12y')

  state.substitutes['sub-aagot'] = {
    id: 'sub-aagot',
    name: 'Ågot Øie',
    avatarInitials: 'ÅØ',
    accentColor: '#f2d0c3',
  }
  state.substitutes['sub-orjan'] = {
    id: 'sub-orjan',
    name: 'Ørjan Vik',
    avatarInitials: 'ØV',
    accentColor: '#cfe6ff',
  }
  state.substituteOrder.push('sub-aagot', 'sub-orjan')

  return state
}

function createEmptyRowState() {
  const state = createSeedPlannerState()

  state.rows['row-1'] = {
    ...state.rows['row-1'],
    rowResponsibleId: null,
  }

  state.needCardOrder.forEach((cardId) => {
    const card = state.needCards[cardId]

    if (card.placement !== 'scheduled') {
      return
    }

    state.needCards[cardId] = {
      ...card,
      placement: 'unscheduled',
      rowId: null,
      timeBlockId: null,
    }
  })

  return state
}

function createCrowdedWeekCellState() {
  const state = createSeedPlannerState()

  state.rows['row-2'] = {
    id: 'row-2',
    order: 1,
    rowResponsibleId: null,
  }
  state.rows['row-3'] = {
    id: 'row-3',
    order: 2,
    rowResponsibleId: null,
  }
  state.rows['row-4'] = {
    id: 'row-4',
    order: 3,
    rowResponsibleId: null,
  }
  state.rowOrder = ['row-1', 'row-2', 'row-3', 'row-4']

  state.needCards['card-samfunn-8c'] = {
    ...state.needCards['card-samfunn-8c'],
    placement: 'scheduled',
    rowId: 'row-2',
    timeBlockId: '08:30',
  }
  state.needCards['card-engelsk-7b'] = {
    ...state.needCards['card-engelsk-7b'],
    placement: 'scheduled',
    rowId: 'row-3',
    timeBlockId: '08:30',
  }
  state.needCards['card-norsk-9a'] = {
    ...state.needCards['card-norsk-9a'],
    placement: 'scheduled',
    rowId: 'row-4',
    timeBlockId: '08:30',
  }

  return state
}

function createTwoCardWeekCellState() {
  const state = createSeedPlannerState()

  state.rows['row-2'] = {
    id: 'row-2',
    order: 1,
    rowResponsibleId: null,
  }
  state.rowOrder = ['row-1', 'row-2']

  state.needCards['card-samfunn-8c'] = {
    ...state.needCards['card-samfunn-8c'],
    placement: 'scheduled',
    rowId: 'row-2',
    timeBlockId: '08:30',
  }

  return state
}

function createWideBoardState() {
  const state = createSeedPlannerState()

  for (let index = 8; index <= 12; index += 1) {
    const rowId = `row-${index}`
    state.rows[rowId] = {
      id: rowId,
      order: index - 1,
      rowResponsibleId: null,
    }
    state.rowOrder.push(rowId)
  }

  return state
}

async function openPlannerWithState(page: Page, state: ReturnType<typeof createMultiPageRailState>) {
  await page.addInitScript(
    ({ storageKey, nextState }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(nextState))
    },
    { storageKey: STORAGE_KEY, nextState: state },
  )

  await page.goto('/')
}

test('drags an unscheduled card onto an existing row header and autoplaces it at its allocated time', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const card = tasksPanel.getByLabel(/kort krle 9a/i)
  const rowHeader = page.locator('.row-header-dropzone').first()

  await dragTo(page, card, rowHeader)

  await expect(tasksPanel.getByLabel(/kort krle 9a/i)).toHaveCount(0)
  await expect(page.getByTestId('calendar-cell-row-1-13:30').getByLabel(/kort krle 9a/i)).toBeVisible()
})

test('drags an unscheduled card onto the new-row placeholder to create a row and autoplace it', async ({
  page,
}) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const card = tasksPanel.getByLabel(/kort norsk 9a/i)
  const newRowPlaceholder = page.getByTestId('new-row-placeholder')

  await dragTo(page, card, newRowPlaceholder)

  await expect(tasksPanel.getByLabel(/kort norsk 9a/i)).toHaveCount(0)
  await expect(page.getByText('2 rader')).toBeVisible()
  await expect(page.getByTestId('calendar-cell-row-2-08:30').getByLabel(/kort norsk 9a/i)).toBeVisible()
})

test('renders the new-row placeholder without regular time slots', async ({ page }) => {
  await openFreshPlanner(page)

  const placeholder = page.getByTestId('new-row-placeholder')

  await expect(placeholder).toBeVisible()

  const cellCount = await placeholder.locator('[data-testid^="calendar-cell-"]').count()
  expect(cellCount).toBe(0)
})

test('opens a planned lesson detail sheet inside week view and supports an explicit day-view jump', async ({
  page,
}) => {
  await openFreshPlanner(page)

  await page.getByRole('tab', { name: 'Uke' }).click()
  await expect(page.getByRole('region', { name: 'Ukeoversikt' })).toBeVisible()

  await page.getByRole('button', { name: /åpne detaljer for naturfag 7b/i }).click()

  const dialog = page.getByRole('dialog')

  await expect(page.getByRole('region', { name: 'Ukeoversikt' })).toBeVisible()
  await expect(dialog).toContainText('Naturfag 7B')
  await expect(dialog.getByRole('button', { name: /åpne i dagvisning/i })).toBeVisible()

  await dialog.getByRole('button', { name: /åpne i dagvisning/i }).click()

  await expect(page.getByRole('region', { name: 'Dagstavle' })).toBeVisible()
  await expect(dialog).toContainText('Naturfag 7B')
})

test('renders the week view as an aligned timetable with quiet empty cells', async ({
  page,
}) => {
  await openFreshPlanner(page)

  await page.getByRole('tab', { name: 'Uke' }).click()
  await expect(page.getByRole('region', { name: 'Ukeoversikt' })).toBeVisible()
  await expect(page.getByText('Ingen planlagte timer')).toHaveCount(0)

  const metrics = await page.evaluate(() => {
    const scroll = document.querySelector<HTMLElement>('.planner-grid-scroll--week')
    const board = document.querySelector<HTMLElement>('.week-board')
    const lastRow = document.querySelector<HTMLElement>('.week-board__row-grid:last-child')
    const headerCells = Array.from(
      document.querySelectorAll<HTMLElement>('.week-board__header-grid > *'),
    )
    const firstRowCells = Array.from(
      document.querySelectorAll<HTMLElement>('.week-board__row-grid:first-child > *'),
    )
    const emptyCells = Array.from(document.querySelectorAll<HTMLElement>('.week-board__empty'))

    if (!scroll || !board || !lastRow || headerCells.length === 0 || firstRowCells.length === 0) {
      return null
    }

    const boardRect = board.getBoundingClientRect()
    const lastRowRect = lastRow.getBoundingClientRect()
    const headerRects = headerCells.map((cell) => cell.getBoundingClientRect())
    const firstRowRects = firstRowCells.map((cell) => cell.getBoundingClientRect())
    const headerHeights = headerRects.map((rect) => rect.height)
    const rowHeights = firstRowRects.map((rect) => rect.height)
    const headerHeightSpread = Math.max(...headerHeights) - Math.min(...headerHeights)
    const rowHeightSpread = Math.max(...rowHeights) - Math.min(...rowHeights)

    return {
      columnsAlign:
        headerRects.length === firstRowRects.length &&
        headerRects.every(
          (rect, index) =>
            Math.abs(rect.left - firstRowRects[index].left) <= 1 &&
            Math.abs(rect.width - firstRowRects[index].width) <= 1,
        ),
      headerHeightSpread,
      rowHeightSpread,
      selectedHeaderCount: document.querySelectorAll('.week-board__day-header--selected').length,
      selectedCellCount: document.querySelectorAll('.week-board__cell--selected').length,
      emptyCellCount: emptyCells.length,
      emptyTextCount: emptyCells.filter((cell) => cell.textContent?.trim().length).length,
      boardBottomGap: Math.abs(boardRect.bottom - lastRowRect.bottom),
      boardFitsViewport: board.scrollWidth - scroll.clientWidth <= 1,
    }
  })

  expect(metrics).not.toBeNull()
  expect(metrics?.columnsAlign).toBe(true)
  expect(metrics?.headerHeightSpread).toBeLessThanOrEqual(1)
  expect(metrics?.rowHeightSpread).toBeLessThanOrEqual(1)
  expect(metrics?.selectedHeaderCount).toBe(1)
  expect(metrics?.selectedCellCount).toBeGreaterThan(0)
  expect(metrics?.emptyCellCount).toBeGreaterThan(0)
  expect(metrics?.emptyTextCount).toBe(0)
  expect(metrics?.boardBottomGap).toBeLessThanOrEqual(3)
  expect(metrics?.boardFitsViewport).toBe(true)
})

test('packs two week-view lessons side by side with readable spacing and equal widths', async ({
  page,
}) => {
  await openPlannerWithState(page, createTwoCardWeekCellState())

  await page.getByRole('tab', { name: 'Uke' }).click()

  const mondayMorningCell = page
    .locator('.week-board__row-grid')
    .first()
    .locator('.week-board__cell')
    .first()

  await expect(mondayMorningCell.locator('.week-mini-card')).toHaveCount(2)
  await expect(mondayMorningCell.locator('.week-mini-card__more')).toHaveCount(0)

  const metrics = await mondayMorningCell.evaluate((cell) => {
    const cards = Array.from(cell.querySelectorAll<HTMLElement>('.week-mini-card'))

    if (cards.length !== 2) {
      return null
    }

    const rects = cards.map((card) => card.getBoundingClientRect())
    const gap = rects[1].left - rects[0].right

    return {
      horizontalOrder: rects[0].left < rects[1].left,
      sameRow: Math.abs(rects[0].top - rects[1].top) < 2,
      equalWidths: Math.abs(rects[0].width - rects[1].width) < 2,
      equalHeights: Math.abs(rects[0].height - rects[1].height) < 2,
      nonOverlapping: rects[0].right <= rects[1].left,
      stableGap: gap >= 3 && gap <= 14,
    }
  })

  expect(metrics).not.toBeNull()
  expect(metrics?.horizontalOrder).toBe(true)
  expect(metrics?.sameRow).toBe(true)
  expect(metrics?.equalWidths).toBe(true)
  expect(metrics?.equalHeights).toBe(true)
  expect(metrics?.nonOverlapping).toBe(true)
  expect(metrics?.stableGap).toBe(true)
})

test('lays out multiple week-view lessons side by side with equal widths and compact overflow', async ({
  page,
}) => {
  await openPlannerWithState(page, createCrowdedWeekCellState())

  await page.getByRole('tab', { name: 'Uke' }).click()

  const mondayMorningCell = page.locator('.week-board__row-grid').first().locator('.week-board__cell').first()

  await expect(mondayMorningCell.locator('.week-mini-card')).toHaveCount(3)
  await expect(mondayMorningCell.locator('.week-mini-card__more')).toHaveText('+1')

  const metrics = await mondayMorningCell.evaluate((cell) => {
    const cards = Array.from(cell.querySelectorAll<HTMLElement>('.week-mini-card'))
    const overflow = cell.querySelector<HTMLElement>('.week-mini-card__more')

    if (cards.length !== 3 || !overflow) {
      return null
    }

    const rects = cards.map((card) => card.getBoundingClientRect())
    const tops = rects.map((rect) => rect.top)
    const widths = rects.map((rect) => rect.width)

    return {
      horizontalOrder:
        rects[0].left < rects[1].left && rects[1].left < rects[2].left,
      sameRow: tops.every((top) => Math.abs(top - tops[0]) < 2),
      equalWidths: widths.every((width) => Math.abs(width - widths[0]) < 2),
      overflowIsCompact: overflow.getBoundingClientRect().width < widths[0],
    }
  })

  expect(metrics).not.toBeNull()
  expect(metrics?.horizontalOrder).toBe(true)
  expect(metrics?.sameRow).toBe(true)
  expect(metrics?.equalWidths).toBe(true)
  expect(metrics?.overflowIsCompact).toBe(true)
})

test('rejects dragging a need card into the wrong time column', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const card = tasksPanel.getByLabel(/kort norsk 9a/i)
  const wrongTimeCell = page.getByTestId('calendar-cell-row-1-13:30')

  await dragTo(page, card, wrongTimeCell)

  await expect(tasksPanel.getByLabel(/kort norsk 9a/i)).toBeVisible()
  await expect(wrongTimeCell.getByLabel(/kort norsk 9a/i)).toHaveCount(0)
})

test('fills the full empty slot during drag and keeps side cards aligned with board cards', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const source = tasksPanel.getByLabel(/kort krle 9a/i)
  const targetCell = page.getByTestId('calendar-cell-row-1-13:30')

  const sourceBox = await source.boundingBox()
  const targetBox = await targetCell.boundingBox()

  if (!sourceBox || !targetBox) {
    throw new Error('Missing drag geometry for slot coverage test.')
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2 + 8,
    sourceBox.y + sourceBox.height / 2 + 8,
    { steps: 4 },
  )
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 },
  )

  const metrics = await page.evaluate(() => {
    const tasksRegion = document.querySelector('[aria-label="Uplanlagt"]')
    const peopleRegion = document.querySelector('[aria-label="Vikarer"]')
    const tasksCard = tasksRegion?.querySelector('article.need-card')
    const cell = document.querySelector('[data-testid="calendar-cell-row-1-13:30"]')
    const state = cell?.querySelector('.empty-cell-state')
    const label = state?.querySelector('.empty-cell-state__label')

    if (
      !(tasksRegion instanceof HTMLElement) ||
      !(peopleRegion instanceof HTMLElement) ||
      !(tasksCard instanceof HTMLElement) ||
      !(cell instanceof HTMLElement) ||
      !(state instanceof HTMLElement) ||
      !(label instanceof HTMLElement)
    ) {
      return null
    }

    const cellRect = cell.getBoundingClientRect()
    const stateRect = state.getBoundingClientRect()
    const labelRect = label.getBoundingClientRect()

    return {
      tasksPanelWidth: tasksRegion.getBoundingClientRect().width,
      peoplePanelWidth: peopleRegion.getBoundingClientRect().width,
      tasksCardWidth: tasksCard.getBoundingClientRect().width,
      widthGap: cellRect.width - stateRect.width,
      heightGap: cellRect.height - stateRect.height,
      labelCenterDeltaX: Math.abs(
        labelRect.left + labelRect.width / 2 - (stateRect.left + stateRect.width / 2),
      ),
      labelCenterDeltaY: Math.abs(
        labelRect.top + labelRect.height / 2 - (stateRect.top + stateRect.height / 2),
      ),
      statusLabelsInCards: document.querySelectorAll('.need-card .assignee-badge__label').length,
    }
  })

  await page.mouse.up()

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(metrics.tasksPanelWidth).toBeGreaterThan(240)
  expect(metrics.peoplePanelWidth).toBeGreaterThan(230)
  expect(metrics.tasksCardWidth).toBeGreaterThan(170)
  expect(metrics.tasksCardWidth).toBeLessThan(metrics.tasksPanelWidth)
  expect(metrics.widthGap).toBeLessThanOrEqual(2.5)
  expect(metrics.heightGap).toBeLessThanOrEqual(2.5)
  expect(metrics.labelCenterDeltaX).toBeLessThanOrEqual(1)
  expect(metrics.labelCenterDeltaY).toBeLessThanOrEqual(1)
  expect(metrics.statusLabelsInCards).toBe(0)
})

test('fills scheduled board cards to the full cell footprint', async ({ page }) => {
  await openFreshPlanner(page)

  const metrics = await page.evaluate(() => {
    const cell = document.querySelector('[data-testid="calendar-cell-row-1-08:30"]')
    const card = cell?.querySelector('article.need-card')

    if (!(cell instanceof HTMLElement) || !(card instanceof HTMLElement)) {
      return null
    }

    const cellRect = cell.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()

    return {
      widthGap: cellRect.width - cardRect.width,
      heightGap: cellRect.height - cardRect.height,
    }
  })

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(metrics.widthGap).toBeLessThanOrEqual(2.5)
  expect(metrics.heightGap).toBeLessThanOrEqual(2.5)
})

test('hides room in day-board cards while keeping it in the detail sheet', async ({ page }) => {
  await openFreshPlanner(page)

  const boardCard = page.getByTestId('calendar-cell-row-1-08:30').getByLabel(/kort matematikk 6a/i)

  await expect(boardCard.locator('.need-card__room')).toHaveCount(0)

  await boardCard.click()

  const dialog = page.getByRole('dialog')

  await expect(dialog).toContainText('Matematikk 6A')
  await expect(dialog.getByText('Rom', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Rom 204')).toBeVisible()
})

test('keeps compact day-board rows aligned after the density reduction', async ({ page }) => {
  await openFreshPlanner(page)

  const metrics = await page.evaluate(() => {
    const axisCell = document.querySelector('.time-header-cell--axis')
    const lessonCell = document.querySelector('[data-testid="calendar-cell-row-1-08:30"]')
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const expectedRowHeight = rootFontSize * 8.4

    if (!(axisCell instanceof HTMLElement) || !(lessonCell instanceof HTMLElement)) {
      return null
    }

    const axisRect = axisCell.getBoundingClientRect()
    const lessonRect = lessonCell.getBoundingClientRect()

    return {
      axisHeight: axisRect.height,
      lessonHeight: lessonRect.height,
      expectedRowHeight,
      rowTopDelta: Math.abs(axisRect.top - lessonRect.top),
      rowBottomDelta: Math.abs(axisRect.bottom - lessonRect.bottom),
    }
  })

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(Math.abs(metrics.lessonHeight - metrics.expectedRowHeight)).toBeLessThanOrEqual(4)
  expect(Math.abs(metrics.axisHeight - metrics.lessonHeight)).toBeLessThanOrEqual(1)
  expect(metrics.rowTopDelta).toBeLessThanOrEqual(1)
  expect(metrics.rowBottomDelta).toBeLessThanOrEqual(1)
})

test('keeps the day-view time axis aligned as a real sticky first column', async ({ page }) => {
  await page.setViewportSize({ width: 1300, height: 1200 })
  await openPlannerWithState(page, createWideBoardState())

  const metrics = await page.evaluate(async () => {
    const scroll = document.querySelector('.planner-grid-scroll')
    const axisHeader = document.querySelector('.calendar-header-spacer--time-axis')
    const laneHeader = document.querySelector('.row-header-dropzone--header')
    const axisCell = document.querySelector('.time-header-cell--axis')
    const lessonCell = document.querySelector('[data-testid="calendar-cell-row-1-08:30"]')
    const lessonCard = lessonCell?.querySelector('article.need-card')

    if (
      !(scroll instanceof HTMLElement) ||
      !(axisHeader instanceof HTMLElement) ||
      !(laneHeader instanceof HTMLElement) ||
      !(axisCell instanceof HTMLElement) ||
      !(lessonCell instanceof HTMLElement) ||
      !(lessonCard instanceof HTMLElement)
    ) {
      return null
    }

    const axisHeaderBefore = axisHeader.getBoundingClientRect()
    const laneHeaderBefore = laneHeader.getBoundingClientRect()
    const axisCellRect = axisCell.getBoundingClientRect()
    const lessonCellRect = lessonCell.getBoundingClientRect()
    const lessonCardRect = lessonCard.getBoundingClientRect()

    scroll.scrollLeft = 320
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))

    const axisHeaderAfter = axisHeader.getBoundingClientRect()
    const laneHeaderAfter = laneHeader.getBoundingClientRect()
    const axisCellAfter = axisCell.getBoundingClientRect()
    const scrollRect = scroll.getBoundingClientRect()
    const gutterProbe = document.elementFromPoint(
      scrollRect.left + 2,
      axisCellAfter.top + axisCellAfter.height / 2,
    )

    return {
      headerHeightDelta: Math.abs(axisHeaderBefore.height - laneHeaderBefore.height),
      rowTopDelta: Math.abs(axisCellRect.top - lessonCellRect.top),
      rowBottomDelta: Math.abs(axisCellRect.bottom - lessonCellRect.bottom),
      lessonStartsAfterAxis: lessonCellRect.left - axisCellRect.right,
      cardStartsAfterAxis: lessonCardRect.left - axisCellRect.right,
      axisStickyDelta: Math.abs(axisHeaderAfter.left - axisHeaderBefore.left),
      laneScrollDelta: laneHeaderBefore.left - laneHeaderAfter.left,
      axisLeftGap: Math.abs(axisCellAfter.left - scrollRect.left),
      gutterLeaksSlot: Boolean(gutterProbe?.closest('.calendar-board__slot, .need-card')),
    }
  })

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(metrics.headerHeightDelta).toBeLessThanOrEqual(1)
  expect(metrics.rowTopDelta).toBeLessThanOrEqual(1)
  expect(metrics.rowBottomDelta).toBeLessThanOrEqual(1)
  expect(metrics.lessonStartsAfterAxis).toBeGreaterThan(0)
  expect(metrics.cardStartsAfterAxis).toBeGreaterThan(0)
  expect(metrics.axisStickyDelta).toBeLessThanOrEqual(1)
  expect(metrics.laneScrollDelta).toBeGreaterThan(40)
  expect(metrics.axisLeftGap).toBeLessThanOrEqual(1)
  expect(metrics.gutterLeaksSlot).toBe(false)
})

test('keeps day-board lane widths fixed when lane count changes', async ({ page }) => {
  await openPlannerWithState(page, createEmptyRowState())

  const compactMetrics = await page.evaluate(() => {
    const laneHeaders = Array.from(document.querySelectorAll('.calendar-board__lane'))
    const laneSlots = Array.from(document.querySelectorAll('.calendar-board__slot'))

    if (laneHeaders.length === 0 || laneSlots.length === 0) {
      return null
    }

    const collectWidths = (elements: Element[]) =>
      elements.map((element) => element.getBoundingClientRect().width)

    const headerWidths = collectWidths(laneHeaders)
    const slotWidths = collectWidths(laneSlots.slice(0, laneHeaders.length))

    return {
      firstHeaderWidth: headerWidths[0],
      firstSlotWidth: slotWidths[0],
      headerSpread: Math.max(...headerWidths) - Math.min(...headerWidths),
      slotSpread: Math.max(...slotWidths) - Math.min(...slotWidths),
    }
  })

  await openPlannerWithState(page, createWideBoardState())

  const wideMetrics = await page.evaluate(() => {
    const laneHeaders = Array.from(document.querySelectorAll('.calendar-board__lane'))
    const laneSlots = Array.from(document.querySelectorAll('.calendar-board__slot'))

    if (laneHeaders.length === 0 || laneSlots.length === 0) {
      return null
    }

    const collectWidths = (elements: Element[]) =>
      elements.map((element) => element.getBoundingClientRect().width)

    const headerWidths = collectWidths(laneHeaders)
    const slotWidths = collectWidths(laneSlots.slice(0, laneHeaders.length))

    return {
      firstHeaderWidth: headerWidths[0],
      firstSlotWidth: slotWidths[0],
      headerSpread: Math.max(...headerWidths) - Math.min(...headerWidths),
      slotSpread: Math.max(...slotWidths) - Math.min(...slotWidths),
    }
  })

  expect(compactMetrics).not.toBeNull()
  expect(wideMetrics).not.toBeNull()

  if (!compactMetrics || !wideMetrics) {
    return
  }

  expect(Math.abs(compactMetrics.firstHeaderWidth - wideMetrics.firstHeaderWidth)).toBeLessThanOrEqual(1)
  expect(Math.abs(compactMetrics.firstSlotWidth - wideMetrics.firstSlotWidth)).toBeLessThanOrEqual(1)
  expect(compactMetrics.headerSpread).toBeLessThanOrEqual(1)
  expect(compactMetrics.slotSpread).toBeLessThanOrEqual(1)
  expect(wideMetrics.headerSpread).toBeLessThanOrEqual(1)
  expect(wideMetrics.slotSpread).toBeLessThanOrEqual(1)
})

test('keeps the remaining row-card icon containers perfectly circular', async ({ page }) => {
  await openPlannerWithState(page, createEmptyRowState())

  const metrics = await page.evaluate(() => {
    const ghostAvatar = document.querySelector('.row-header__avatar--ghost')
    const rowUtility = document.querySelector('.row-header__utility')
    const emptyTeacherPill = document.querySelector('.teacher-pill--empty')

    if (
      !(ghostAvatar instanceof HTMLElement) ||
      !(rowUtility instanceof HTMLElement) ||
      !(emptyTeacherPill instanceof HTMLElement)
    ) {
      return null
    }

    const toBox = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()

      return {
        width: rect.width,
        height: rect.height,
        delta: Math.abs(rect.width - rect.height),
      }
    }

    return {
      ghostAvatar: toBox(ghostAvatar),
      rowUtility: toBox(rowUtility),
      emptyTeacherPill: toBox(emptyTeacherPill),
    }
  })

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(metrics.ghostAvatar.delta).toBeLessThanOrEqual(1)
  expect(metrics.rowUtility.delta).toBeLessThanOrEqual(1)
  expect(metrics.emptyTeacherPill.delta).toBeLessThanOrEqual(1)
})

test('keeps side rails fixed while the Unplanned rail scrolls as a single vertical list', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await openPlannerWithState(page, createMultiPageRailState())

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const peoplePanel = page.getByRole('region', { name: 'Vikarer' })

  await expect(tasksPanel.locator('[aria-label^="Kort "]')).toHaveCount(10)
  await expect(peoplePanel.locator('[aria-label^="Vikar "]')).toHaveCount(5)
  await expect(tasksPanel.getByRole('navigation', { name: /sider for uplanlagt/i })).toHaveCount(0)
  await expect(peoplePanel.getByText('1 / 2')).toBeVisible()
  await expect(tasksPanel.getByLabel(/kort ekstrafag 11z/i)).toHaveCount(1)
  await expect(peoplePanel.getByLabel(/vikar ågot øie/i)).toHaveCount(0)

  await peoplePanel.getByRole('button', { name: /neste side i vikarer/i }).click()

  await expect(tasksPanel.locator('[aria-label^="Kort "]')).toHaveCount(10)
  await expect(peoplePanel.locator('[aria-label^="Vikar "]')).toHaveCount(2)
  await expect(tasksPanel.getByLabel(/kort ekstrafag 11z/i)).toHaveCount(1)
  await expect(peoplePanel.getByLabel(/vikar ågot øie/i)).toBeVisible()
  await expect(peoplePanel.getByText('2 / 2')).toBeVisible()

  const metrics = await page.evaluate(() => {
    const tasksPanel = document.querySelector('[aria-label="Uplanlagt"]')
    const peoplePanel = document.querySelector('[aria-label="Vikarer"]')
    const board = document.querySelector('[aria-label="Dagstavle"]')
    const tasksScroll = tasksPanel?.querySelector('.panel-scroll')
    const peopleScroll = peoplePanel?.querySelector('.panel-scroll')
    const scrollingElement = document.scrollingElement

    if (
      !(tasksPanel instanceof HTMLElement) ||
      !(peoplePanel instanceof HTMLElement) ||
      !(board instanceof HTMLElement) ||
      !(tasksScroll instanceof HTMLElement) ||
      !(peopleScroll instanceof HTMLElement) ||
      !(scrollingElement instanceof HTMLElement)
    ) {
      return null
    }

    const taskCards = Array.from(tasksScroll.querySelectorAll<HTMLElement>('.need-card-host--panel')).slice(0, 6)
    const taskCardRects = taskCards.map((card) => card.getBoundingClientRect())
    const taskCardLefts = taskCardRects.map((rect) => rect.left)
    const taskCardTops = taskCardRects.map((rect) => rect.top)

    return {
      pageHeight: scrollingElement.scrollHeight,
      viewportHeight: window.innerHeight,
      tasksPanelHeight: tasksPanel.getBoundingClientRect().height,
      peoplePanelHeight: peoplePanel.getBoundingClientRect().height,
      boardHeight: board.getBoundingClientRect().height,
      tasksScrollHeight: tasksScroll.scrollHeight,
      tasksClientHeight: tasksScroll.clientHeight,
      tasksScrollWidth: tasksScroll.scrollWidth,
      tasksClientWidth: tasksScroll.clientWidth,
      tasksCardCount: taskCards.length,
      tasksSingleColumn:
        taskCardLefts.length > 1 &&
        taskCardLefts.every((left) => Math.abs(left - taskCardLefts[0]) <= 1),
      tasksTopDownOrder:
        taskCardTops.length > 1 &&
        taskCardTops.every((top, index) => index === 0 || top > taskCardTops[index - 1]),
      peopleScrollHeight: peopleScroll.scrollHeight,
      peopleClientHeight: peopleScroll.clientHeight,
      peopleScrollWidth: peopleScroll.scrollWidth,
      peopleClientWidth: peopleScroll.clientWidth,
    }
  })

  expect(metrics).not.toBeNull()

  if (!metrics) {
    return
  }

  expect(metrics.pageHeight - metrics.viewportHeight).toBeLessThanOrEqual(2)
  expect(metrics.tasksCardCount).toBeGreaterThanOrEqual(6)
  expect(metrics.tasksSingleColumn).toBe(true)
  expect(metrics.tasksTopDownOrder).toBe(true)
  expect(metrics.tasksScrollHeight).toBeGreaterThan(metrics.tasksClientHeight + 20)
  expect(metrics.peopleScrollHeight - metrics.peopleClientHeight).toBeLessThanOrEqual(2)
  expect(metrics.tasksScrollWidth - metrics.tasksClientWidth).toBeLessThanOrEqual(1)
  expect(metrics.peopleScrollWidth - metrics.peopleClientWidth).toBeLessThanOrEqual(1)
  expect(Math.abs(metrics.tasksPanelHeight - metrics.boardHeight)).toBeLessThanOrEqual(2)
  expect(Math.abs(metrics.peoplePanelHeight - metrics.boardHeight)).toBeLessThanOrEqual(2)
})

test('keeps scheduled lesson card footers inside the card and cell bounds', async ({ page }) => {
  await openFreshPlanner(page)

  const geometry = await page.locator('[data-testid^="calendar-cell-"]').evaluateAll((cells) =>
    cells.flatMap((cell) => {
      const card = cell.querySelector('article.need-card')
      const footerBadge = card?.querySelector('.need-card__footer .assignee-badge')

      if (!(card instanceof HTMLElement) || !(footerBadge instanceof HTMLElement)) {
        return []
      }

      const cellRect = cell.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const badgeRect = footerBadge.getBoundingClientRect()

      return [
        {
          cardBottomInset: cardRect.bottom - badgeRect.bottom,
          cellBottomInset: cellRect.bottom - cardRect.bottom,
          footerInsideCard: badgeRect.bottom <= cardRect.bottom + 0.5,
          cardInsideCell: cardRect.bottom <= cellRect.bottom + 0.5,
        },
      ]
    }),
  )

  expect(geometry.length).toBeGreaterThan(0)

  for (const cardGeometry of geometry) {
    expect(cardGeometry.footerInsideCard).toBe(true)
    expect(cardGeometry.cardInsideCell).toBe(true)
    expect(cardGeometry.cardBottomInset).toBeGreaterThan(4)
    expect(cardGeometry.cellBottomInset).toBeGreaterThanOrEqual(0)
    expect(cardGeometry.cellBottomInset).toBeLessThanOrEqual(2.5)
  }
})

test('moves a card through the detail sheet and persists on reload', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })

  await tasksPanel.getByLabel(/kort krle 9a/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-1')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort krle 9a/i)).toHaveCount(0)

  await page.reload()

  await expect(
    page.getByRole('region', { name: 'Uplanlagt' }).getByLabel(/kort krle 9a/i),
  ).toHaveCount(0)
})

test('moves a card through the detail sheet and supports undo in-session', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })

  await tasksPanel.getByLabel(/kort krle 9a/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-1')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort krle 9a/i)).toHaveCount(0)

  await page.getByRole('button', { name: /^angre$/i }).click()

  await expect(
    page.getByRole('region', { name: 'Uplanlagt' }).getByLabel(/kort krle 9a/i),
  ).toBeVisible()
})

test('requires explicit confirmation before a time change affects detail-sheet placement', async ({
  page,
}) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })

  await tasksPanel.getByLabel(/kort samfunnsfag 8c/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Tidspunkt').selectOption('13:30')
  await dialog.getByLabel('Rad').selectOption('row-1')

  await expect(dialog.getByRole('button', { name: /lagre plassering/i })).toBeDisabled()

  await dialog.getByRole('button', { name: /bekreft tidspunkt/i }).click()
  await dialog.getByLabel('Rad').selectOption('row-1')

  await expect(dialog.getByRole('button', { name: /lagre plassering/i })).toBeEnabled()

  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort samfunnsfag 8c/i)).toHaveCount(0)
  await expect(page.getByTestId('calendar-cell-row-1-13:30').getByLabel(/kort samfunnsfag 8c/i)).toBeVisible()
})

import { expect, test, type Locator, type Page } from '@playwright/test'

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

test('drags an unscheduled card into the grid', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })
  const card = tasksPanel.getByLabel(/kort norsk 9a/i)
  const targetCell = page.getByTestId('calendar-cell-row-3-08:30')

  await dragTo(page, card, targetCell)

  await expect(tasksPanel.getByLabel(/kort norsk 9a/i)).toHaveCount(0)
  await expect(targetCell.getByLabel(/kort norsk 9a/i)).toBeVisible()
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
    expect(cardGeometry.cellBottomInset).toBeGreaterThan(4)
  }
})

test('moves a card through the detail sheet and persists on reload', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })

  await tasksPanel.getByLabel(/kort norsk 9a/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-3')
  await dialog.getByLabel('Tid').selectOption('08:30')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort norsk 9a/i)).toHaveCount(0)

  await page.reload()

  await expect(
    page.getByRole('region', { name: 'Uplanlagt' }).getByLabel(/kort norsk 9a/i),
  ).toHaveCount(0)
})

test('moves a card through the detail sheet and supports undo in-session', async ({ page }) => {
  await openFreshPlanner(page)

  const tasksPanel = page.getByRole('region', { name: 'Uplanlagt' })

  await tasksPanel.getByLabel(/kort norsk 9a/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-3')
  await dialog.getByLabel('Tid').selectOption('08:30')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort norsk 9a/i)).toHaveCount(0)

  await page.getByRole('button', { name: /^angre$/i }).click()

  await expect(
    page.getByRole('region', { name: 'Uplanlagt' }).getByLabel(/kort norsk 9a/i),
  ).toBeVisible()
})

import { expect, test, type Locator, type Page } from '@playwright/test'

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
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 18 },
  )
  await page.mouse.up()
}

test('drags an unscheduled card into the grid', async ({ page }) => {
  await page.goto('/')

  const tasksPanel = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Uplanlagt' }),
  })
  const card = tasksPanel.getByLabel(/kort samfunnsfag 8c/i)
  const targetCell = page.getByTestId('calendar-cell-row-3-08:30')

  await dragTo(page, card, targetCell)

  await expect(tasksPanel.getByLabel(/kort samfunnsfag 8c/i)).toHaveCount(0)
  await expect(targetCell.getByLabel(/kort samfunnsfag 8c/i)).toBeVisible()
})

test('moves a card through the detail sheet and persists on reload', async ({ page }) => {
  await page.goto('/')

  const tasksPanel = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Uplanlagt' }),
  })

  await tasksPanel.getByLabel(/kort samfunnsfag 8c/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-3')
  await dialog.getByLabel('Tid').selectOption('08:30')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort samfunnsfag 8c/i)).toHaveCount(0)

  await page.reload()

  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Uplanlagt' }) })
      .getByLabel(/kort samfunnsfag 8c/i),
  ).toHaveCount(0)
})

test('moves a card through the detail sheet and supports undo in-session', async ({ page }) => {
  await page.goto('/')

  const tasksPanel = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Uplanlagt' }),
  })

  await tasksPanel.getByLabel(/kort samfunnsfag 8c/i).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Rad').selectOption('row-3')
  await dialog.getByLabel('Tid').selectOption('08:30')
  await dialog.getByRole('button', { name: /lagre plassering/i }).click()
  await dialog.getByRole('button', { name: /lukk/i }).click()

  await expect(tasksPanel.getByLabel(/kort samfunnsfag 8c/i)).toHaveCount(0)

  await page.getByRole('button', { name: /^angre$/i }).click()

  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Uplanlagt' }) })
      .getByLabel(/kort samfunnsfag 8c/i),
  ).toBeVisible()
})

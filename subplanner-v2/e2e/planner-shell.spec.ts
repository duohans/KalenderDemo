import { expect, test } from '@playwright/test'

test('renders the planner shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('planner-board')).toBeVisible()
  await expect(page.getByTestId('unplanned-panel')).toContainText('Uplanlagt')
  await expect(page.getByTestId('substitute-panel')).toContainText('Vikarer')
  await expect(page.getByTestId('row-header-row-1')).toContainText('Camillas timer')
  await expect(page.getByTestId('need-card-need-1')).toContainText('6A Matematikk')
})

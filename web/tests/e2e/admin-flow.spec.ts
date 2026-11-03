import { expect, test, type Page } from '@playwright/test'
import { collectDialogs, loginAs, USERS } from './helpers'

async function submitFormOf(page: Page, placeholder: string) {
  await page.getByPlaceholder(placeholder).locator('xpath=ancestor::form').locator('button[type="submit"]').click()
}

test.describe('administrator', () => {
  test.beforeEach(async ({ page }) => {
    collectDialogs(page)
    await loginAs(page, USERS.admin)
    await page.goto('/admin')
  })

  test('creează o clasă și o materie', async ({ page }) => {
    await page.getByPlaceholder('Nume (ex: 11-B)').fill('XI-E2E')
    await submitFormOf(page, 'Nume (ex: 11-B)')
    await expect(page.locator('.badge', { hasText: 'XI-E2E' })).toBeVisible()

    await page.getByPlaceholder('Denumire materie').fill('Robotică E2E')
    await submitFormOf(page, 'Denumire materie')
    await expect(page.locator('.badge', { hasText: 'Robotică E2E' })).toBeVisible()
  })

  test('emite o invitație și afișează linkul de activare', async ({ page }) => {
    await page.getByPlaceholder('utilizator@liceu.ro').fill(`invitat.${Date.now()}@example.com`)
    await submitFormOf(page, 'utilizator@liceu.ro')
    await expect(page.getByText(/\/register\?token=/)).toBeVisible()
  })

  test('jurnalul de audit înregistrează acțiunile administrative', async ({ page }) => {
    await page.getByPlaceholder('Denumire materie').fill('Audit E2E')
    await submitFormOf(page, 'Denumire materie')
    await expect(page.locator('.badge', { hasText: 'Audit E2E' })).toBeVisible()
    await page.reload()
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })
})

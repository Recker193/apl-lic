import { expect, test } from '@playwright/test'
import { collectDialogs, login, loginAs, logout, PASSWORD, USERS } from './helpers'

test.describe('autentificare', () => {
  test('redirecționează un vizitator neautentificat către login', async ({ page }) => {
    await page.goto('/groups')
    await expect(page).toHaveURL(/\/login/)
  })

  test('respinge parola greșită', async ({ page }) => {
    await login(page, USERS.student, 'parola-gresita')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('button', { name: /Deconectare/ })).toHaveCount(0)
  })

  test('conectare și deconectare', async ({ page }) => {
    await loginAs(page, USERS.student)
    await logout(page)
    await page.goto('/groups')
    await expect(page).toHaveURL(/\/login/)
  })

  test('un elev nu poate deschide pagina de administrare', async ({ page }) => {
    await loginAs(page, USERS.student)
    await page.goto('/admin')
    await expect(page.getByText('Registru de audit')).toHaveCount(0)
  })

  test('invitație → înregistrare → conectare', async ({ page, browser }) => {
    collectDialogs(page)
    await loginAs(page, USERS.admin)
    await page.goto('/admin')

    const email = `nou.${Date.now()}@example.com`
    await page.getByPlaceholder('utilizator@liceu.ro').fill(email)
    const invitation = page.waitForResponse(
      (res) => res.url().endsWith('/api/v1/invitations') && res.request().method() === 'POST',
    )
    await page.locator('form', { has: page.getByPlaceholder('utilizator@liceu.ro') }).locator('button[type="submit"]').click()
    const { token } = (await (await invitation).json()) as { token: string }
    expect(token).toBeTruthy()

    // Context nou, fără sesiunea administratorului.
    const context = await browser.newContext({ baseURL: new URL(page.url()).origin })
    const guest = await context.newPage()
    await guest.goto(`/register?token=${token}`)
    const inputs = guest.locator('input')
    await inputs.nth(0).fill('Ion')
    await inputs.nth(1).fill('Popescu')
    await inputs.nth(2).fill(PASSWORD)
    await guest.locator('form button[type="submit"]').click()
    await expect(guest.getByText(/Contul a fost creat/)).toBeVisible()

    await guest.waitForURL(/\/login/)
    await loginAs(guest, email)
    await context.close()
  })
})

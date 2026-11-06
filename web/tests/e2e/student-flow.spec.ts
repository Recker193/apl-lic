import { expect, test } from '@playwright/test'
import { collectDialogs, loginAs, openFirstGroup, USERS } from './helpers'

test.describe('elev', () => {
  test('fără drept de postare nu vede butonul de anunț', async ({ page }) => {
    await loginAs(page, USERS.student)
    await openFirstGroup(page)
    await expect(page.getByRole('button', { name: /Anunțuri \(/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Adaugă anunț/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Setări/ })).toHaveCount(0)
  })

  test('cu drept de postare publică un anunț', async ({ page }) => {
    await loginAs(page, USERS.poster)
    await openFirstGroup(page)
    await page.getByRole('button', { name: /Adaugă anunț/ }).click()
    await page.getByPlaceholder('Titlul anunțului').fill('Anunț elev E2E')
    await page.getByPlaceholder('Conținutul anunțului...').fill('Întâlnire după ore')
    await page.getByRole('button', { name: 'Publică anunțul' }).click()
    await expect(page.getByRole('heading', { name: /Anunț elev E2E/ })).toBeVisible()
  })

  test('își marchează progresul la o temă și îl păstrează după reîncărcare', async ({ page }) => {
    // Profesorul creează tema, apoi elevul o completează.
    collectDialogs(page)
    await loginAs(page, USERS.teacher)
    await openFirstGroup(page)
    await page.getByRole('button', { name: /Teme \(/ }).click()
    await page.getByRole('button', { name: 'Temă nouă' }).click()
    await page.getByPlaceholder('Titlu temă').fill('Tema progres E2E')
    await page.getByPlaceholder('Cerințe și instrucțiuni...').fill('Rezolvați exercițiile')
    const due = new Date(Date.now() + 3 * 24 * 3600 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    await page
      .locator('input[type="datetime-local"]')
      .fill(`${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`)
    await page.getByRole('button', { name: 'Salvează tema' }).click()
    await expect(page.getByRole('heading', { name: 'Tema progres E2E' })).toBeVisible()
    await page.getByRole('button', { name: /Deconectare/ }).click()
    await expect(page).toHaveURL(/\/login/)

    await loginAs(page, USERS.student)
    await openFirstGroup(page)
    await page.getByRole('button', { name: /Teme \(/ }).click()
    const card = page.locator('.card', { has: page.getByRole('heading', { name: 'Tema progres E2E' }) })
    await card.locator('select').selectOption('COMPLETED')
    await expect(card.locator('select')).toHaveValue('COMPLETED')

    await page.reload()
    await page.getByRole('button', { name: /Teme \(/ }).click()
    await expect(
      page.locator('.card', { has: page.getByRole('heading', { name: 'Tema progres E2E' }) }).locator('select'),
    ).toHaveValue('COMPLETED')
  })

  test('izolare între licee: un elev nu vede grupul altui liceu', async ({ page }) => {
    // ID-ul grupului din Liceul A este citit de profesorul A, apoi folosit de elevul din Liceul B.
    await loginAs(page, USERS.teacher)
    await openFirstGroup(page)
    const groupAUrl = page.url()
    await page.getByRole('button', { name: /Deconectare/ }).click()

    await loginAs(page, USERS.studentB)
    await page.goto(groupAUrl)
    await expect(page.getByText(/Not Found|nu a fost găsit/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Info IX A' })).toHaveCount(0)
  })
})

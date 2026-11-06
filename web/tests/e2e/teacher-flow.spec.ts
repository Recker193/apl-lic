import { expect, test } from '@playwright/test'
import { collectDialogs, loginAs, openFirstGroup, USERS } from './helpers'

// Semnătura %PDF- este suficientă: backend-ul verifică magic bytes.
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')

function nextWeek(): string {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

test.describe('profesor', () => {
  test.beforeEach(async ({ page }) => {
    collectDialogs(page)
    await loginAs(page, USERS.teacher)
    await openFirstGroup(page)
  })

  test('publică o temă', async ({ page }) => {
    await page.getByRole('button', { name: /Teme \(/ }).click()
    await page.getByRole('button', { name: 'Temă nouă' }).click()
    await page.getByPlaceholder('Titlu temă').fill('Tema E2E')
    await page.getByPlaceholder('Cerințe și instrucțiuni...').fill('Rezolvați exercițiile 1-5')
    await page.locator('input[type="datetime-local"]').fill(nextWeek())
    await page.getByRole('button', { name: 'Salvează tema' }).click()
    await expect(page.getByRole('heading', { name: 'Tema E2E' })).toBeVisible()
  })

  test('programează un test', async ({ page }) => {
    await page.getByRole('button', { name: /Teste \/ Examene/ }).click()
    await page.getByRole('button', { name: 'Programează test' }).click()
    await page.getByPlaceholder('Denumire test (ex: Teză semestrială)').fill('Test E2E')
    await page.getByPlaceholder('Materie evaluată sau instrucțiuni...').fill('Capitolul 1')
    await page.locator('input[type="datetime-local"]').fill(nextWeek())
    await page.getByRole('button', { name: 'Programează', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Test E2E' })).toBeVisible()
  })

  test('încarcă un PDF care se descarcă ca atașament', async ({ page }) => {
    await page.getByRole('button', { name: /Materiale \(/ }).click()
    await page.getByRole('button', { name: 'Încarcă material' }).click()
    await page.getByPlaceholder('Titlu material (ex: Sinteză Capitol 1)').fill('Material E2E')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'suport.pdf',
      mimeType: 'application/pdf',
      buffer: PDF,
    })
    await page.getByRole('button', { name: 'Încarcă fișierul' }).click()
    await expect(page.getByRole('heading', { name: 'Material E2E' })).toBeVisible()

    const href = await page.getByRole('link', { name: /Descarcă/ }).first().getAttribute('href')
    const res = await page.request.get(href!)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-disposition']).toMatch(/^attachment/)
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('respinge un executabil redenumit .pdf', async ({ page }) => {
    const dialogs = collectDialogs(page)
    await page.getByRole('button', { name: /Materiale \(/ }).click()
    await page.getByRole('button', { name: 'Încarcă material' }).click()
    await page.getByPlaceholder('Titlu material (ex: Sinteză Capitol 1)').fill('Fals')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'fals.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('MZ\x90\x00\x03\x00\x00\x00'),
    })
    await page.getByRole('button', { name: 'Încarcă fișierul' }).click()
    await expect.poll(() => dialogs.length).toBeGreaterThan(0)
    await expect(page.getByRole('heading', { name: 'Fals' })).toHaveCount(0)
  })

  test('acordă și retrage permisiunea de postare', async ({ page }) => {
    await page.getByRole('button', { name: /Membri \(/ }).click()
    const row = page.getByText('Student A', { exact: true }).locator('xpath=../..')
    await expect(row.getByRole('button', { name: /Doar citire \(Permite postare\)/ })).toBeVisible()

    await row.getByRole('button', { name: /Doar citire/ }).click()
    await expect(row.getByRole('button', { name: /Poate posta \(Revocă\)/ })).toBeVisible()

    await row.getByRole('button', { name: /Poate posta/ }).click()
    await expect(row.getByRole('button', { name: /Doar citire/ })).toBeVisible()
  })
})

import { expect, type Page } from '@playwright/test'

export const PASSWORD = 'Password123!'

export const USERS = {
  admin: 'admin.a@example.com',
  teacher: 'teacher.a@example.com',
  student: 'student.a@example.com', // canPost = false
  poster: 'poster.a@example.com', // canPost = true
  studentB: 'student.b@example.com', // alt liceu
} as const

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login')
  await page.getByPlaceholder('nume@liceu.ro').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: 'Conectare' }).click()
}

export async function loginAs(page: Page, email: string) {
  await login(page, email)
  await expect(page.getByRole('button', { name: /Deconectare/ })).toBeVisible()
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /Deconectare/ }).click()
  await expect(page).toHaveURL(/\/login/)
}

/** Deschide primul grup din listă (fiecare utilizator seedat are un singur grup). */
export async function openFirstGroup(page: Page) {
  await page.goto('/groups')
  await page.locator('a[href^="/groups/"]').first().click()
  await expect(page).toHaveURL(/\/groups\/[0-9a-f-]+$/)
}

/** Alerturile aplicației nu trebuie să blocheze testul; le acceptăm și le colectăm. */
export function collectDialogs(page: Page): string[] {
  const messages: string[] = []
  page.on('dialog', (dialog) => {
    messages.push(dialog.message())
    void dialog.accept()
  })
  return messages
}

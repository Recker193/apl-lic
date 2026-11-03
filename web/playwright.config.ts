import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Porturi dedicate, ca să nu se confunde cu serverele de dezvoltare (3000/5173).
const API_PORT = 3100
const WEB_PORT = 5174

// Backend-ul rulează cu .env.test (baza hssa_test, NODE_ENV=test).
function loadEnvFile(path: string): Record<string, string> {
  const env: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (match) env[match[1]] = match[2]
  }
  return env
}

const rootDir = resolve(import.meta.dirname, '..')
const backendEnv = {
  ...loadEnvFile(resolve(rootDir, '.env.test')),
  PORT: String(API_PORT),
}

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Testele împart o singură bază de date; rulează secvențial.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start',
      cwd: rootDir,
      env: backendEnv,
      url: `http://localhost:${API_PORT}/api/v1/health/readiness`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      env: { VITE_API_TARGET: `http://localhost:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})

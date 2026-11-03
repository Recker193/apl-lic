import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

// Resetează și populează hssa_test înainte de pornirea serverelor de test.
export default function globalSetup() {
  execSync('npm run e2e:seed', {
    cwd: resolve(import.meta.dirname, '..', '..', '..'),
    stdio: 'inherit',
  })
}

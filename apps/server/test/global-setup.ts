import { execSync } from 'node:child_process'

export default function setup() {
  execSync('pnpm build:assets', { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' })
}

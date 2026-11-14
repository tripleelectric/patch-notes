import type { SessionUser } from '../auth.js'
import { Shell } from './shell.js'

export function HomePage({ user }: { user: SessionUser }) {
  return (
    <Shell title="Patch notes" user={user}>
      <h1 class="text-2xl font-semibold">Patch notes</h1>
      <p class="mt-2 text-stone-600">Nothing published yet.</p>
    </Shell>
  )
}

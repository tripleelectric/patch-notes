import { Layout } from './layout.js'

export function HomePage() {
  return (
    <Layout title="patch-notes">
      <main class="mx-auto max-w-3xl p-8">
        <h1 class="text-2xl font-semibold">patch-notes</h1>
        <p class="mt-2 text-stone-600">Server is running.</p>
      </main>
    </Layout>
  )
}

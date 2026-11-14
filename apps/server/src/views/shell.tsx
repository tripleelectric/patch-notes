import type { PropsWithChildren } from '@kitajs/html'
import type { SessionUser } from '../auth.js'
import { Layout } from './layout.js'

export function Shell({ title, user, children }: PropsWithChildren<{ title: string; user: SessionUser }>) {
  return (
    <Layout title={`${title} - patch-notes`}>
      <header class="border-b border-stone-200 bg-white">
        <nav class="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3 text-sm">
          <a href="/" class="font-semibold tracking-tight">
            patch-notes
          </a>
          {user.role === 'admin' && (
            <a href="/admin/users" class="text-stone-600 hover:text-stone-900">
              Users
            </a>
          )}
          <span class="ml-auto text-stone-500" safe>
            {user.name}
          </span>
          <form method="post" action="/logout">
            <button class="text-stone-600 hover:text-stone-900">Log out</button>
          </form>
        </nav>
      </header>
      <main class="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </Layout>
  )
}

export function Alert({ kind, message, children }: PropsWithChildren<{ kind: 'error' | 'success'; message?: string }>) {
  const style = kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} class={`mb-4 rounded border px-3 py-2 text-sm ${style}`}>
      {message !== undefined && <p safe>{message}</p>}
      {children}
    </div>
  )
}

export const inputClass = 'mt-1 block w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-500 focus:outline-none'
export const buttonClass = 'rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700'

export function CenteredCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Layout title={`${title} - patch-notes`}>
      <main class="mx-auto mt-24 max-w-sm px-6">
        <h1 class="mb-6 text-xl font-semibold" safe>
          {title}
        </h1>
        {children}
      </main>
    </Layout>
  )
}

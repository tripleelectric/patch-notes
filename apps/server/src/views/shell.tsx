import type { PropsWithChildren } from '@kitajs/html'
import type { SessionUser } from '../auth.js'
import { currentTheme, t, THEMES, type MessageKey, type Theme } from '../i18n.js'
import { Layout } from './layout.js'

const THEME_ICON: Record<Theme, string> = {
  system: 'M8 1.5a6.5 6.5 0 1 0 0 13v-13Z',
  light: 'M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM8 0v2M8 14v2M0 8h2M14 8h2M2.3 2.3l1.4 1.4M12.3 12.3l1.4 1.4M2.3 13.7l1.4-1.4M12.3 3.7l1.4-1.4',
  dark: 'M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7Z',
}

/** Cycles system, light, dark; works without JavaScript. */
function ThemeToggle() {
  const current = currentTheme()
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]!
  const label = t('theme.next', { current: t(`theme.${current}` as MessageKey), next: t(`theme.${next}` as MessageKey) })
  return (
    <form method="post" action="/preferences/theme" class="shrink-0">
      <input type="hidden" name="theme" value={next} />
      <button class="grid size-8 place-items-center rounded-md text-muted hover:bg-panel-2 hover:text-fg" aria-label={label} title={label}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" class="overflow-visible">
          {current === 'system' ? <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" /> : ''}
          <path
            d={THEME_ICON[current]}
            fill={current === 'light' ? 'none' : 'currentColor'}
            stroke="currentColor"
            stroke-width={current === 'light' ? '1.4' : '0'}
            stroke-linecap="round"
          />
        </svg>
      </button>
    </form>
  )
}

export const containerClass = 'mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10'

export function Shell({ title, user, toolbar, children }: PropsWithChildren<{ title: string; user: SessionUser; toolbar?: JSX.Element }>) {
  // Already rendered HTML from our own components.
  const safeToolbar = toolbar ?? ''
  return (
    <Layout title={`${title} - patch-notes`}>
      <header class="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <nav class={`${containerClass} flex h-14 items-center gap-4 text-sm`}>
          <a href="/" class="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
            <span class="size-2.5 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />
            patch-notes
          </a>
          <div class="min-w-0 grow">{safeToolbar}</div>
          {user.role === 'admin' ? (
            <a href="/admin/users" class="shrink-0 rounded-md px-2 py-1 text-muted hover:bg-panel-2 hover:text-fg" safe>
              {t('nav.users')}
            </a>
          ) : (
            ''
          )}
          <ThemeToggle />
          <span class="hidden shrink-0 text-muted md:inline" safe>
            {user.name}
          </span>
          <form method="post" action="/logout" class="shrink-0">
            <button class="rounded-md px-2 py-1 text-muted hover:bg-panel-2 hover:text-fg" safe>
              {t('nav.logout')}
            </button>
          </form>
        </nav>
      </header>
      <main class={`${containerClass} pb-24`}>{children}</main>
    </Layout>
  )
}

export function Alert({ kind, message, children }: PropsWithChildren<{ kind: 'error' | 'success'; message?: string }>) {
  const style = kind === 'error' ? 'border-flag/40 text-flag' : 'border-ok/40 text-ok'
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} class={`mb-4 rounded-md border bg-panel px-3 py-2 text-sm ${style}`}>
      {message !== undefined && <p safe>{message}</p>}
      {children}
    </div>
  )
}

export const inputClass =
  'mt-1 block w-full rounded-md border-0 bg-panel px-3 py-2 text-base text-fg shadow-[inset_0_0_0_1px_var(--line)] focus-visible:outline-2 focus-visible:outline-accent sm:text-sm'
export const buttonClass = 'rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-90'

export function CenteredCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <Layout title={`${title} - patch-notes`}>
      <div class="px-4 pt-16 sm:pt-24">
        <main class="mx-auto max-w-sm rounded-xl bg-panel p-8 shadow-[inset_0_0_0_1px_var(--line)]">
          <h1 class="mb-6 text-xl font-semibold" safe>
            {title}
          </h1>
          {children}
        </main>
      </div>
    </Layout>
  )
}

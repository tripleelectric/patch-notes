import { MIN_PASSWORD } from '../auth.js'
import { t } from '../i18n.js'
import { Alert, buttonClass, CenteredCard, inputClass } from './shell.js'

export function LoginPage({ next, email = '', error }: { next: string; email?: string; error?: string }) {
  return (
    <CenteredCard title={t('login.title')}>
      {error ? <Alert kind="error" message={error} /> : null}
      <form method="post" action="/login" class="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label class="block text-sm font-medium">
          <span safe>{t('login.email')}</span>
          <input class={inputClass} type="email" name="email" value={email} autocomplete="username" required autofocus />
        </label>
        <label class="block text-sm font-medium">
          <span safe>{t('login.password')}</span>
          <input class={inputClass} type="password" name="password" autocomplete="current-password" required />
        </label>
        <button class={`${buttonClass} w-full`} safe>
          {t('login.submit')}
        </button>
      </form>
    </CenteredCard>
  )
}

export function InvitePage({ email, action, name = '', error }: { email: string; action: string; name?: string; error?: string }) {
  return (
    <CenteredCard title={t('invite.title')}>
      <p class="mb-4 text-sm text-muted">
        <span safe>{t('invite.introBefore')}</span> <strong safe>{email}</strong>. <span safe>{t('invite.introAfter')}</span>
      </p>
      {error ? <Alert kind="error" message={error} /> : null}
      <form method="post" action={action} class="space-y-4">
        <label class="block text-sm font-medium">
          <span safe>{t('invite.name')}</span>
          <input class={inputClass} name="name" value={name} maxlength="100" autocomplete="name" required autofocus />
        </label>
        <label class="block text-sm font-medium">
          <span safe>{t('invite.password', { min: MIN_PASSWORD })}</span>
          <input class={inputClass} type="password" name="password" minlength={String(MIN_PASSWORD)} autocomplete="new-password" required />
        </label>
        <label class="block text-sm font-medium">
          <span safe>{t('invite.repeat')}</span>
          <input class={inputClass} type="password" name="confirm" autocomplete="new-password" required />
        </label>
        <button class={`${buttonClass} w-full`} safe>
          {t('invite.submit')}
        </button>
      </form>
    </CenteredCard>
  )
}

export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <CenteredCard title={title}>
      <p class="text-sm text-muted" safe>
        {message}
      </p>
      <p class="mt-6 text-sm">
        <a class="underline" href="/" safe>
          {t('message.home')}
        </a>
      </p>
    </CenteredCard>
  )
}

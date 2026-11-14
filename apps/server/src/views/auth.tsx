import { MIN_PASSWORD } from '../auth.js'
import { Alert, buttonClass, CenteredCard, inputClass } from './shell.js'

export function LoginPage({ next, email = '', error }: { next: string; email?: string; error?: string }) {
  return (
    <CenteredCard title="Log in">
      {error ? <Alert kind="error" message={error} /> : null}
      <form method="post" action="/login" class="space-y-4">
        <input type="hidden" name="next" value={next} />
        <label class="block text-sm font-medium">
          Email
          <input class={inputClass} type="email" name="email" value={email} autocomplete="username" required autofocus />
        </label>
        <label class="block text-sm font-medium">
          Password
          <input class={inputClass} type="password" name="password" autocomplete="current-password" required />
        </label>
        <button class={`${buttonClass} w-full`}>Log in</button>
      </form>
    </CenteredCard>
  )
}

export function InvitePage({ email, action, name = '', error }: { email: string; action: string; name?: string; error?: string }) {
  return (
    <CenteredCard title="Join patch-notes">
      <p class="mb-4 text-sm text-stone-600">
        You were invited as <strong safe>{email}</strong>. Choose your name and password.
      </p>
      {error ? <Alert kind="error" message={error} /> : null}
      <form method="post" action={action} class="space-y-4">
        <label class="block text-sm font-medium">
          Name
          <input class={inputClass} name="name" value={name} maxlength="100" autocomplete="name" required autofocus />
        </label>
        <label class="block text-sm font-medium">
          Password (at least {MIN_PASSWORD} characters)
          <input class={inputClass} type="password" name="password" minlength={String(MIN_PASSWORD)} autocomplete="new-password" required />
        </label>
        <label class="block text-sm font-medium">
          Repeat password
          <input class={inputClass} type="password" name="confirm" autocomplete="new-password" required />
        </label>
        <button class={`${buttonClass} w-full`}>Create account</button>
      </form>
    </CenteredCard>
  )
}

export function MessagePage({ title, message }: { title: string; message: string }) {
  return (
    <CenteredCard title={title}>
      <p class="text-sm text-stone-600" safe>
        {message}
      </p>
      <p class="mt-6 text-sm">
        <a class="underline" href="/">
          Go to start page
        </a>
      </p>
    </CenteredCard>
  )
}

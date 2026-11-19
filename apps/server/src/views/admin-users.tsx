import { ROLES, type SessionUser } from '../auth.js'
import { formatDate, t } from '../i18n.js'
import { Alert, buttonClass, inputClass, Shell } from './shell.js'

interface UserRow {
  id: string
  name: string
  email: string
  role: string | null
}
interface InviteRow {
  id: string
  email: string
  role: string
  expiresAt: Date
}

const roleLabel = (role: string) => (role === 'admin' ? t('role.admin') : t('role.reviewer'))

function RoleSelect({ value }: { value: string }) {
  return (
    <select name="role" aria-label={t('users.role')} class="h-9 rounded-md border-0 bg-panel shadow-[inset_0_0_0_1px_var(--line)] px-2 text-sm">
      {ROLES.map((role) => (
        <option value={role} selected={role === value} safe>
          {roleLabel(role)}
        </option>
      ))}
    </select>
  )
}

export function AdminUsersPage(props: { user: SessionUser; users: UserRow[]; invites: InviteRow[]; inviteLink?: string; error?: string }) {
  const { user, users, invites, inviteLink, error } = props
  return (
    <Shell title={t('users.title')} user={user}>
      <h1 class="mb-6 pt-10 text-2xl font-semibold" safe>
        {t('users.title')}
      </h1>
      {error ? <Alert kind="error" message={error} /> : null}
      {inviteLink ? (
        <Alert kind="success" message={t('users.inviteCreated')}>
          <input class={`${inputClass} font-mono`} readonly value={inviteLink} aria-label={t('users.inviteLink')} />
        </Alert>
      ) : null}

      <table class="w-full text-left text-sm">
        <thead class="border-b border-line text-muted">
          <tr>
            <th class="py-2 font-medium" safe>
              {t('users.name')}
            </th>
            <th class="py-2 font-medium" safe>
              {t('users.email')}
            </th>
            <th class="py-2 font-medium" safe>
              {t('users.role')}
            </th>
            <th class="py-2" />
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <tr class="border-b border-line">
              <td class="py-2" safe>
                {row.name}
              </td>
              <td class="py-2 text-muted" safe>
                {row.email}
              </td>
              <td class="py-2">
                <form method="post" action={`/admin/users/${row.id}/role`} class="flex items-center gap-2">
                  <RoleSelect value={row.role ?? 'reviewer'} />
                  <button class="text-muted underline" safe>
                    {t('users.save')}
                  </button>
                </form>
              </td>
              <td class="py-2 text-right">
                {row.id !== user.id ? (
                  <form method="post" action={`/admin/users/${row.id}/remove`}>
                    <button class="text-flag underline" safe>
                      {t('users.remove')}
                    </button>
                  </form>
                ) : (
                  ''
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 class="mt-10 mb-3 text-lg font-semibold" safe>
        {t('users.inviteHeading')}
      </h2>
      <form method="post" action="/admin/invites" class="flex flex-wrap items-end gap-3">
        <label class="block grow text-sm font-medium">
          <span safe>{t('users.email')}</span>
          <input class={`${inputClass} h-9 py-0`} type="email" name="email" required />
        </label>
        <RoleSelect value="reviewer" />
        <button class={`${buttonClass} h-9 py-0`} safe>
          {t('users.inviteSubmit')}
        </button>
      </form>

      {invites.length > 0 ? (
        <>
          <h2 class="mt-10 mb-3 text-lg font-semibold" safe>
            {t('users.pending')}
          </h2>
          <ul class="divide-y divide-line text-sm">
            {invites.map((invite) => (
              <li class="flex items-center gap-4 py-2">
                <span safe>{invite.email}</span>
                <span class="text-muted" safe>
                  {roleLabel(invite.role)}
                </span>
                <span class="text-muted" safe>
                  {t('users.expires', { date: formatDate(invite.expiresAt.toISOString().slice(0, 10)) })}
                </span>
                <form method="post" action={`/admin/invites/${invite.id}/revoke`} class="ml-auto">
                  <button class="text-flag underline" safe>
                    {t('users.revoke')}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      ) : (
        ''
      )}
    </Shell>
  )
}

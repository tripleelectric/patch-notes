import { ROLES, type SessionUser } from '../auth.js'
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

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

function RoleSelect({ value }: { value: string }) {
  return (
    <select name="role" class="rounded border border-stone-300 bg-white px-2 py-1 text-sm">
      {ROLES.map((role) => (
        <option value={role} selected={role === value}>
          {role}
        </option>
      ))}
    </select>
  )
}

export function AdminUsersPage(props: { user: SessionUser; users: UserRow[]; invites: InviteRow[]; inviteLink?: string; error?: string }) {
  const { user, users, invites, inviteLink, error } = props
  return (
    <Shell title="Users" user={user}>
      <h1 class="mb-6 text-2xl font-semibold">Users</h1>
      {error ? <Alert kind="error" message={error} /> : null}
      {inviteLink ? (
        <Alert kind="success" message="Invite created. Send this link; it is shown only once and works for 7 days:">
          <input class={`${inputClass} font-mono`} readonly value={inviteLink} aria-label="Invite link" />
        </Alert>
      ) : null}

      <table class="w-full text-left text-sm">
        <thead class="border-b border-stone-200 text-stone-500">
          <tr>
            <th class="py-2 font-medium">Name</th>
            <th class="py-2 font-medium">Email</th>
            <th class="py-2 font-medium">Role</th>
            <th class="py-2" />
          </tr>
        </thead>
        <tbody>
          {users.map((row) => (
            <tr class="border-b border-stone-100">
              <td class="py-2" safe>
                {row.name}
              </td>
              <td class="py-2 text-stone-600" safe>
                {row.email}
              </td>
              <td class="py-2">
                <form method="post" action={`/admin/users/${row.id}/role`} class="flex gap-2">
                  <RoleSelect value={row.role ?? 'reviewer'} />
                  <button class="text-stone-600 underline">Save</button>
                </form>
              </td>
              <td class="py-2 text-right">
                {row.id !== user.id && (
                  <form method="post" action={`/admin/users/${row.id}/remove`}>
                    <button class="text-red-700 underline">Remove</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 class="mt-10 mb-3 text-lg font-semibold">Invite someone</h2>
      <form method="post" action="/admin/invites" class="flex flex-wrap items-end gap-3">
        <label class="block grow text-sm font-medium">
          Email
          <input class={inputClass} type="email" name="email" required />
        </label>
        <label class="block text-sm font-medium">
          Role
          <div class="mt-1">
            <RoleSelect value="reviewer" />
          </div>
        </label>
        <button class={buttonClass}>Create invite link</button>
      </form>

      {invites.length > 0 && (
        <>
          <h2 class="mt-10 mb-3 text-lg font-semibold">Pending invites</h2>
          <ul class="divide-y divide-stone-100 text-sm">
            {invites.map((invite) => (
              <li class="flex items-center gap-4 py-2">
                <span safe>{invite.email}</span>
                <span class="text-stone-500" safe>
                  {invite.role}
                </span>
                <span class="text-stone-500" safe>{`expires ${formatDate(invite.expiresAt)}`}</span>
                <form method="post" action={`/admin/invites/${invite.id}/revoke`} class="ml-auto">
                  <button class="text-red-700 underline">Revoke</button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  )
}

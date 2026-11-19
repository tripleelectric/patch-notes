import { t, type MessageKey } from '../i18n.js'
import { TYPES } from '../review.js'

const known = (list: readonly string[], value: string) => list.includes(value)
export const typeLabel = (type: string) => (known(TYPES, type) ? t(`type.${type}` as MessageKey) : type)
export const typePlural = (type: string) => (known(TYPES, type) ? t(`types.${type}` as MessageKey) : type)

const TYPE_DOT: Record<string, string> = { feature: 'bg-feature', fix: 'bg-fix', change: 'bg-change' }

export function TypeTag({ type }: { type: string }) {
  return (
    <span class="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
      <span class={`size-[7px] rounded-full ${TYPE_DOT[type] ?? 'bg-change'}`} aria-hidden="true" />
      <span safe>{typeLabel(type)}</span>
    </span>
  )
}

/** Marks entries with an open change request; entries are otherwise just read. */
export function ChangeRequestMarker() {
  return (
    <span class="inline-flex shrink-0 items-center gap-1.5 text-xs text-flag">
      <span class="size-1.5 rounded-full bg-flag shadow-[0_0_8px_var(--flag)]" aria-hidden="true" />
      <span safe>{t('status.changes-requested')}</span>
    </span>
  )
}

export const openRequestsLabel = (count: number) => (count === 1 ? t('release.openRequest') : t('release.openRequests', { count }))

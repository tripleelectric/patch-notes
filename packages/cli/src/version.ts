type Version = [number, number, number]

export const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
export const BUMPS = ['patch', 'minor', 'major'] as const
export type Bump = (typeof BUMPS)[number]

const parseVersion = (text: string): Version => text.split('.').map(Number) as Version
const compare = (a: Version, b: Version) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

export function nextVersion(arg: Bump | string, existing: readonly string[]): { ok: true; value: string } | { ok: false; message: string } {
  const latest = existing.map(parseVersion).sort(compare).at(-1)
  const [major, minor, patch] = latest ?? [0, 0, 0]
  if (arg === 'major') return { ok: true, value: `${major + 1}.0.0` }
  if (arg === 'minor') return { ok: true, value: `${major}.${minor + 1}.0` }
  if (arg === 'patch') return { ok: true, value: `${major}.${minor}.${patch + 1}` }
  if (latest !== undefined && compare(parseVersion(arg), latest) <= 0) {
    return { ok: false, message: `version ${arg} must be higher than the latest release ${latest.join('.')}` }
  }
  return { ok: true, value: arg }
}

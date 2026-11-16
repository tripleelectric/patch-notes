// Seeds a running patch-notes server with the demo project, two reviewers and review history.
// Usage: DEMO_URL=http://localhost:3000 PATCHNOTES_TOKEN=... ADMIN_PASSWORD=... node scripts/seed-demo.mjs
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.DEMO_URL ?? 'http://localhost:3000'
const ADMIN = { email: process.env.ADMIN_EMAIL ?? 'admin@example.com', password: process.env.ADMIN_PASSWORD ?? 'demo-admin-password' }
const REVIEWERS = {
  petra: { name: 'Petra Schulz', email: 'petra@example.com', password: 'demo-review-password' },
  markus: { name: 'Markus Weber', email: 'markus@example.com', password: 'demo-review-password' },
}
const root = new URL('..', import.meta.url).pathname
const cli = join(root, 'packages/cli/dist/patchnotes.js')

const cookieOf = (response) => response.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ')

async function post(path, data, cookie) {
  const response = await fetch(BASE + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE, ...(cookie && { cookie }) },
    body: new URLSearchParams(data),
  })
  if (response.status >= 400) throw new Error(`POST ${path} -> ${response.status}`)
  return response
}

async function login({ email, password }) {
  const response = await fetch(`${BASE}/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
    body: new URLSearchParams({ email, password }),
  })
  return response.status === 303 ? cookieOf(response) : undefined
}

async function ensureReviewer(adminCookie, user) {
  const existing = await login(user)
  if (existing) return existing
  const page = await (await post('/admin/invites', { email: user.email, role: 'reviewer' }, adminCookie)).text()
  const link = /value="(http[^"]+\/invite\/[^"]+)"/.exec(page)?.[1]
  if (!link) throw new Error(`no invite link for ${user.email}`)
  return cookieOf(await post(new URL(link).pathname, { name: user.name, password: user.password, confirm: user.password }))
}

const review = (cookie, id, action, body = '') => post(`/entries/${id}/review`, { action, body }, cookie)

function publish(dir) {
  console.log(execFileSync(process.execPath, [cli, 'publish'], { cwd: dir, env: { ...process.env }, encoding: 'utf8' }).trim())
}

const project = mkdtempSync(join(tmpdir(), 'patchnotes-demo-'))
try {
  cpSync(join(root, 'examples/demo-project'), project, { recursive: true })
  const config = join(project, 'patchnotes.yaml')
  writeFileSync(config, readFileSync(config, 'utf8').replace(/^server: .*$/m, `server: ${BASE}`))
  publish(project)

  const admin = await login(ADMIN)
  if (!admin) throw new Error(`cannot log in as ${ADMIN.email}`)
  const petra = await ensureReviewer(admin, REVIEWERS.petra)
  const markus = await ensureReviewer(admin, REVIEWERS.markus)

  await review(petra, 'recurring-invoices', 'comment', 'Super, das spart der Buchhaltung jeden Monat einen halben Tag.')
  await review(markus, 'new-navigation', 'comment', 'Auf dem 13"-Laptop geprüft, die eingeklappte Seitenleiste funktioniert.')
  await review(petra, 'currency-format', 'request-changes', 'Steht bei irischen Kunden das Euro-Zeichen wirklich vor dem Betrag?')
  await review(markus, 'currency-format', 'resolve', 'Ja, so ist es in Irland üblich. Zwei Kunden haben es bestätigt.')

  await review(markus, 'invoice-csv-export', 'request-changes', 'Bitte die Kundennummer als Spalte ergänzen, die Buchhaltung gleicht darüber ab.')
  await review(petra, 'payment-reminders', 'comment', 'Sehr gut. Das kündigen wir im Dezember-Newsletter an.')
  await review(petra, 'pdf-umlauts', 'request-changes', 'Der Kundenname stimmt jetzt, aber die Straße zeigt in der PDF-Vorschau noch „K?nigstraße“.')

  // The developer fixes the address line and publishes again: the change request is cleared by the update.
  const entry = join(project, '.patchnotes/unreleased/pdf-umlauts.md')
  writeFileSync(entry, `${readFileSync(entry, 'utf8').trimEnd()}\n\nAdresszeilen nutzen jetzt dieselbe Schrift, Straßennamen mit Umlauten werden also auch korrekt gedruckt.\n`)
  publish(project)
  await review(markus, 'pdf-umlauts', 'comment', 'Vorschau für Königstraße und Mühlenweg geprüft, beides passt jetzt.')
  console.log('seeded reviewers and reviews')
} finally {
  rmSync(project, { recursive: true, force: true })
}

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

  for (const id of ['recurring-invoices', 'stripe-payments', 'due-date-timezone', 'customer-portal', 'login-redirect']) {
    await review(petra, id, 'accept')
  }
  await review(markus, 'new-navigation', 'accept', 'Much better on the dashboard. Checked on a 13" laptop, the collapsed sidebar works.')
  await review(markus, 'currency-format', 'comment', 'Asked two Irish customers, both confirmed the new format.')
  await review(petra, 'currency-format', 'accept')

  await review(markus, 'invoice-csv-export', 'comment', 'Can we add the customer number as a column? Accounting matches on it.')
  await review(petra, 'payment-reminders', 'accept', "Great. Let's announce this in the December newsletter.")
  await review(markus, 'vat-rounding', 'accept')
  await review(petra, 'pdf-umlauts', 'request-changes', 'The customer name is fixed, but the street still shows "K?nigstraße" in the PDF preview.')

  // The developer fixes the address line and publishes again: the entry returns to "awaiting review".
  const entry = join(project, '.patchnotes/unreleased/pdf-umlauts.md')
  writeFileSync(entry, `${readFileSync(entry, 'utf8').trimEnd()}\n\nAddress lines use the same font now, so street names with umlauts print correctly too.\n`)
  publish(project)
  await review(markus, 'pdf-umlauts', 'comment', 'Checked the preview for Königstraße and Mühlenweg, both fine now.')
  console.log('seeded reviewers and reviews')
} finally {
  rmSync(project, { recursive: true, force: true })
}

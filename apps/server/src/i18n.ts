import { AsyncLocalStorage } from 'node:async_hooks'
import type { Language } from '@patch-notes/schema'

const en = {
  'nav.users': 'Users',
  'nav.filters': 'Filter entries',
  'theme.system': 'System theme',
  'theme.light': 'Light theme',
  'theme.dark': 'Dark theme',
  'theme.next': '{current}. Switch to {next}',
  'timeline.title': 'Changelog',
  'timeline.all': 'All',
  'timeline.changes': 'Change requests',
  'timeline.none': 'No entries match this filter.',
  'timeline.feedback': '{count} feedback',
  'nav.logout': 'Log out',

  'login.title': 'Log in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Log in',
  'login.invalid': 'Invalid email or password',

  'invite.title': 'Join patch-notes',
  'invite.introBefore': 'You were invited as',
  'invite.introAfter': 'Choose your name and password.',
  'invite.name': 'Name',
  'invite.password': 'Password (at least {min} characters)',
  'invite.repeat': 'Repeat password',
  'invite.submit': 'Create account',
  'invite.nameRequired': 'Enter your name.',
  'invite.nameTooLong': 'Name is too long.',
  'invite.passwordShort': 'Password needs at least {min} characters.',
  'invite.passwordLong': 'Password is too long.',
  'invite.mismatch': 'Passwords do not match.',
  'invite.checkInput': 'Check your input.',
  'invite.invalidTitle': 'Invite invalid',
  'invite.invalidMessage': 'This invite link is invalid or expired. Ask an admin for a new one.',

  'message.home': 'Go to start page',
  'forbidden.title': 'Not allowed',
  'forbidden.message': 'Only admins can open this page.',
  'notFound.title': 'Not found',
  'notFound.release': 'This patch does not exist.',
  'notFound.entry': 'This entry does not exist.',
  'notFound.file': 'This file does not exist.',

  'users.title': 'Users',
  'users.name': 'Name',
  'users.email': 'Email',
  'users.role': 'Role',
  'users.save': 'Save',
  'users.remove': 'Remove',
  'users.inviteHeading': 'Invite someone',
  'users.inviteSubmit': 'Create invite link',
  'users.inviteCreated': 'Invite created. Send this link; it is shown only once and works for 7 days:',
  'users.inviteLink': 'Invite link',
  'users.pending': 'Pending invites',
  'users.expires': 'expires {date}',
  'users.revoke': 'Revoke',
  'users.invalidInvite': 'Enter a valid email and role.',
  'users.exists': 'A user with {email} already exists.',
  'users.unknownRole': 'Unknown role.',
  'users.notFound': 'User not found.',
  'users.lastAdminDemote': 'The last admin cannot be demoted.',
  'users.lastAdminRemove': 'The last admin cannot be removed.',
  'users.removeSelf': 'You cannot remove yourself.',
  'role.admin': 'admin',
  'role.reviewer': 'reviewer',

  'release.unreleased': 'Unreleased',
  'release.notYet': 'Not yet released',
  'release.entries': '{count} entries',
  'release.entry': '1 entry',
  'release.emptyTitle': 'Nothing published yet',
  'release.emptyHint': "Publish the project's patch notes from its repository:",

  'status.changes-requested': 'Changes requested',
  'type.feature': 'Feature',
  'type.fix': 'Fix',
  'type.change': 'Change',
  'types.feature': 'Features',
  'types.fix': 'Fixes',
  'types.change': 'Changes',

  'entry.before': 'Before',
  'entry.after': 'After',
  'entry.screenshot': 'Screenshot',
  'entry.try': 'Try it ↗',
  'entry.ticket': 'Ticket ↗',
  'entry.ticketN': 'Ticket {n} ↗',
  'entry.removed': 'This entry was removed from the repository and is no longer part of the patch notes.',
  'entry.publisher': 'publish',
  'event.updated': 'updated the entry',
  'event.accepted': 'accepted',
  'event.changes-requested': 'requested changes',
  'event.comment': 'commented',
  'event.resolved': 'marked the change request as resolved',
  'release.openRequests': '{count} open change requests',
  'release.openRequest': '1 open change request',
  'review.resolve': 'Mark as resolved',
  'review.comment': 'Comment',
  'review.placeholder': 'Feedback, questions or what should change',
  'review.requestChanges': 'Request changes',
  'review.commentButton': 'Comment',
  'review.needChanges': 'Describe which changes you need.',
  'review.needComment': 'Write a comment first.',
  'review.tooLong': 'Comments can have at most 5000 characters.',
  'review.invalid': 'Invalid review.',
  'review.removed': 'Removed entries cannot be reviewed.',
} as const

export type MessageKey = keyof typeof en

const de: Record<MessageKey, string> = {
  'nav.users': 'Benutzer',
  'nav.filters': 'Einträge filtern',
  'theme.system': 'Systemdesign',
  'theme.light': 'Helles Design',
  'theme.dark': 'Dunkles Design',
  'theme.next': '{current}. Wechseln zu {next}',
  'timeline.title': 'Changelog',
  'timeline.all': 'Alle',
  'timeline.changes': 'Änderungswünsche',
  'timeline.none': 'Keine Einträge für diesen Filter.',
  'timeline.feedback': '{count} Feedback',
  'nav.logout': 'Abmelden',

  'login.title': 'Anmelden',
  'login.email': 'E-Mail',
  'login.password': 'Passwort',
  'login.submit': 'Anmelden',
  'login.invalid': 'E-Mail oder Passwort ist falsch',

  'invite.title': 'Konto anlegen',
  'invite.introBefore': 'Du wurdest eingeladen als',
  'invite.introAfter': 'Wähle deinen Namen und ein Passwort.',
  'invite.name': 'Name',
  'invite.password': 'Passwort (mindestens {min} Zeichen)',
  'invite.repeat': 'Passwort wiederholen',
  'invite.submit': 'Konto anlegen',
  'invite.nameRequired': 'Bitte gib deinen Namen ein.',
  'invite.nameTooLong': 'Der Name ist zu lang.',
  'invite.passwordShort': 'Das Passwort braucht mindestens {min} Zeichen.',
  'invite.passwordLong': 'Das Passwort ist zu lang.',
  'invite.mismatch': 'Die Passwörter stimmen nicht überein.',
  'invite.checkInput': 'Bitte prüfe deine Eingaben.',
  'invite.invalidTitle': 'Einladung ungültig',
  'invite.invalidMessage': 'Dieser Einladungslink ist ungültig oder abgelaufen. Bitte einen Admin um einen neuen.',

  'message.home': 'Zur Startseite',
  'forbidden.title': 'Kein Zugriff',
  'forbidden.message': 'Nur Admins können diese Seite öffnen.',
  'notFound.title': 'Nicht gefunden',
  'notFound.release': 'Diesen Patch gibt es nicht.',
  'notFound.entry': 'Diesen Eintrag gibt es nicht.',
  'notFound.file': 'Diese Datei gibt es nicht.',

  'users.title': 'Benutzer',
  'users.name': 'Name',
  'users.email': 'E-Mail',
  'users.role': 'Rolle',
  'users.save': 'Speichern',
  'users.remove': 'Entfernen',
  'users.inviteHeading': 'Jemanden einladen',
  'users.inviteSubmit': 'Einladungslink erstellen',
  'users.inviteCreated': 'Einladung erstellt. Schick diesen Link weiter; er wird nur einmal angezeigt und gilt 7 Tage:',
  'users.inviteLink': 'Einladungslink',
  'users.pending': 'Offene Einladungen',
  'users.expires': 'läuft ab am {date}',
  'users.revoke': 'Zurückziehen',
  'users.invalidInvite': 'Bitte gib eine gültige E-Mail und Rolle an.',
  'users.exists': 'Es gibt bereits einen Benutzer mit {email}.',
  'users.unknownRole': 'Unbekannte Rolle.',
  'users.notFound': 'Benutzer nicht gefunden.',
  'users.lastAdminDemote': 'Der letzte Admin kann nicht herabgestuft werden.',
  'users.lastAdminRemove': 'Der letzte Admin kann nicht entfernt werden.',
  'users.removeSelf': 'Du kannst dich nicht selbst entfernen.',
  'role.admin': 'Admin',
  'role.reviewer': 'Reviewer',

  'release.unreleased': 'Unveröffentlicht',
  'release.notYet': 'Noch nicht veröffentlicht',
  'release.entries': '{count} Einträge',
  'release.entry': '1 Eintrag',
  'release.emptyTitle': 'Noch nichts veröffentlicht',
  'release.emptyHint': 'Veröffentliche die Patch Notes aus dem Repository des Projekts:',

  'status.changes-requested': 'Änderungen angefragt',
  'type.feature': 'Funktion',
  'type.fix': 'Bugfix',
  'type.change': 'Änderung',
  'types.feature': 'Neue Funktionen',
  'types.fix': 'Bugfixes',
  'types.change': 'Änderungen',

  'entry.before': 'Vorher',
  'entry.after': 'Nachher',
  'entry.screenshot': 'Screenshot',
  'entry.try': 'Ausprobieren ↗',
  'entry.ticket': 'Ticket ↗',
  'entry.ticketN': 'Ticket {n} ↗',
  'entry.removed': 'Dieser Eintrag wurde aus dem Repository entfernt und ist nicht mehr Teil der Patch Notes.',
  'entry.publisher': 'Veröffentlichung',
  'event.updated': 'hat den Eintrag aktualisiert',
  'event.accepted': 'hat akzeptiert',
  'event.changes-requested': 'hat Änderungen angefragt',
  'event.comment': 'hat kommentiert',
  'event.resolved': 'hat den Änderungswunsch als erledigt markiert',
  'release.openRequests': '{count} offene Änderungswünsche',
  'release.openRequest': '1 offener Änderungswunsch',
  'review.resolve': 'Als erledigt markieren',
  'review.comment': 'Kommentar',
  'review.placeholder': 'Feedback, Fragen oder was sich ändern soll',
  'review.requestChanges': 'Änderungen anfragen',
  'review.commentButton': 'Kommentieren',
  'review.needChanges': 'Beschreibe, welche Änderungen du brauchst.',
  'review.needComment': 'Schreib zuerst einen Kommentar.',
  'review.tooLong': 'Kommentare dürfen höchstens 5000 Zeichen haben.',
  'review.invalid': 'Ungültiges Review.',
  'review.removed': 'Entfernte Einträge können nicht reviewt werden.',
}

const DICTIONARIES: Record<Language, Record<MessageKey, string>> = { en, de }
const LOCALES: Record<Language, string> = { en: 'en-US', de: 'de-DE' }
export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

interface RenderContext {
  language: Language
  theme: Theme
}
const store = new AsyncLocalStorage<RenderContext>()

/** Runs `fn` with the interface language and color theme used by everything it renders. */
export const withContext = <T>(context: RenderContext, fn: () => T): T => store.run(context, fn)
export const currentLanguage = (): Language => store.getStore()?.language ?? 'en'
export const currentTheme = (): Theme => store.getStore()?.theme ?? 'system'

export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return DICTIONARIES[currentLanguage()][key].replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

/** Translates a key stored as a validation message; other strings pass through. */
export const translate = (message: string): string => (message in en ? t(message as MessageKey) : message)

/** `YYYY-MM-DD` as a localized calendar date. */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat(LOCALES[currentLanguage()], { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

export function formatTime(date: Date): string {
  return `${new Intl.DateTimeFormat(LOCALES[currentLanguage()], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)} UTC`
}

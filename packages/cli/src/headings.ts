import type { Language } from '@patch-notes/schema'

/** Body headings `patchnotes new` scaffolds, per content language. */
export const HEADINGS: Record<Language, [string, string, string]> = {
  en: ['What changed', 'Why', 'Decisions'],
  de: ['Was hat sich geändert', 'Warum', 'Entscheidungen'],
}

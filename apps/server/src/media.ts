import { join } from 'node:path'
import { MEDIA_TYPES } from '@patch-notes/schema'
import type { Config } from './config.js'

const EXTENSION_BY_TYPE = new Map<string, string>()
for (const [ext, { contentType }] of Object.entries(MEDIA_TYPES)) {
  if (!EXTENSION_BY_TYPE.has(contentType)) EXTENSION_BY_TYPE.set(contentType, ext)
}

export const mediaDir = (config: Config) => join(config.dataDir, 'media')

/** Stored file name `<sha256>.<ext>`; the extension lets static serving set content type and support ranges. */
export const mediaFileName = (sha256: string, contentType: string) => `${sha256}.${EXTENSION_BY_TYPE.get(contentType) ?? 'bin'}`

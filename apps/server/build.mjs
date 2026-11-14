import { readFileSync } from 'node:fs'
import { build } from 'esbuild'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
// Everything is bundled except runtime dependencies (native better-sqlite3).
const external = Object.keys(pkg.dependencies).flatMap((name) => [name, `${name}/*`])

await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/server.js',
  external,
  jsx: 'automatic',
  jsxImportSource: '@kitajs/html',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
})

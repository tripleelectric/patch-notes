import { build } from 'esbuild'

await build({
  entryPoints: ['src/bin.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: process.argv[2] ?? 'dist/patchnotes.js',
  // bundled CommonJS dependencies (yaml) call require for Node built-ins
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
})

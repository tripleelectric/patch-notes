// Copies client files and fonts into public/assets; Tailwind builds app.css separately.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const out = new URL('../public/assets/', import.meta.url).pathname
mkdirSync(join(out, 'fonts'), { recursive: true })

copyFileSync(require.resolve('htmx.org/dist/htmx.min.js'), join(out, 'htmx.min.js'))
copyFileSync(new URL('../src/client/app.js', import.meta.url).pathname, join(out, 'app.js'))

const fonts = [
  ['@fontsource/ibm-plex-sans', ['400', '500', '600']],
  ['@fontsource/ibm-plex-mono', ['400', '500']],
]
for (const [pkg, weights] of fonts) {
  const dir = join(dirname(require.resolve(`${pkg}/package.json`)), 'files')
  const name = pkg.split('/')[1]
  for (const weight of weights) {
    const file = `${name}-latin-${weight}-normal.woff2`
    copyFileSync(join(dir, file), join(out, 'fonts', file))
  }
}

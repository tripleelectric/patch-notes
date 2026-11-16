import type { PropsWithChildren } from '@kitajs/html'
import { currentLanguage } from '../i18n.js'

const HTMX_CONFIG = JSON.stringify({ includeIndicatorStyles: false, allowEval: false, allowScriptTags: false })

export function Layout({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <html lang={currentLanguage()}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="htmx-config" content={HTMX_CONFIG} />
        <title safe>{title}</title>
        <link rel="stylesheet" href="/assets/app.css" />
        <script src="/assets/htmx.min.js" defer></script>
      </head>
      <body class="min-h-screen bg-stone-50 text-stone-900 antialiased" hx-boost="true">
        {children}
      </body>
    </html>
  )
}

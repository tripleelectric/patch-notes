import type { PropsWithChildren } from '@kitajs/html'
import { currentLanguage, currentTheme } from '../i18n.js'

const HTMX_CONFIG = JSON.stringify({ includeIndicatorStyles: false, allowEval: false, allowScriptTags: false })

export function Layout({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <html lang={currentLanguage()} data-theme={currentTheme() === 'system' ? undefined : currentTheme()}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="htmx-config" content={HTMX_CONFIG} />
        <title safe>{title}</title>
        <link rel="stylesheet" href="/assets/app.css" />
        <script src="/assets/htmx.min.js" defer></script>
        <script src="/assets/app.js" defer></script>
      </head>
      <body class="min-h-screen bg-bg font-sans text-fg antialiased" hx-boost="true">
        {children}
      </body>
    </html>
  )
}

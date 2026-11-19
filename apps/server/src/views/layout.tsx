import type { PropsWithChildren } from '@kitajs/html'
import { currentLanguage, currentTheme, t } from '../i18n.js'

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
        <dialog
          id="lightbox"
          aria-label={t('lightbox.label')}
          class="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
        >
          <figure class="grid justify-items-center gap-3">
            <img data-lightbox-image alt="" class="max-h-[85vh] max-w-[92vw] rounded-lg object-contain shadow-2xl" />
            <figcaption data-lightbox-caption class="max-w-[80ch] px-4 text-center text-sm text-white/85" />
          </figure>
          <button
            data-lightbox-prev
            aria-label={t('lightbox.prev')}
            class="fixed left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80"
          >
            ‹
          </button>
          <button
            data-lightbox-next
            aria-label={t('lightbox.next')}
            class="fixed right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80"
          >
            ›
          </button>
          <form method="dialog">
            <button
              aria-label={t('lightbox.close')}
              class="fixed right-4 top-4 grid size-11 place-items-center rounded-full bg-black/60 text-lg text-white hover:bg-black/80"
            >
              ✕
            </button>
          </form>
        </dialog>
      </body>
    </html>
  )
}

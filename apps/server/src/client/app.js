// Opens the entry an anchor points to (/#entry-<id>), also after htmx-boosted navigation.
function openTarget() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id.startsWith('entry-')) return
  const target = document.getElementById(id)
  if (target instanceof HTMLDetailsElement) {
    target.open = true
    target.scrollIntoView({ block: 'start' })
  }
}

window.addEventListener('hashchange', openTarget)
document.addEventListener('DOMContentLoaded', openTarget)
document.addEventListener('htmx:afterSettle', openTarget)

// Image viewer: entry images open in the page's <dialog id="lightbox"> instead of a new tab.
let lightboxGroup = []
let lightboxIndex = 0

function showLightboxImage(index) {
  const dialog = document.getElementById('lightbox')
  if (!dialog || lightboxGroup.length === 0) return
  lightboxIndex = (index + lightboxGroup.length) % lightboxGroup.length
  const link = lightboxGroup[lightboxIndex]
  const image = dialog.querySelector('[data-lightbox-image]')
  image.src = link.href
  image.alt = link.dataset.caption ?? ''
  dialog.querySelector('[data-lightbox-caption]').textContent = link.dataset.caption ?? ''
  for (const button of dialog.querySelectorAll('[data-lightbox-prev], [data-lightbox-next]')) button.hidden = lightboxGroup.length < 2
}

document.addEventListener('click', (event) => {
  const dialog = document.getElementById('lightbox')
  if (!dialog) return
  const link = event.target.closest('a[data-lightbox]')
  if (link) {
    // Modifier clicks keep the browser default (e.g. open in a new tab).
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    lightboxGroup = [...document.querySelectorAll(`a[data-lightbox="${CSS.escape(link.dataset.lightbox)}"]`)]
    showLightboxImage(lightboxGroup.indexOf(link))
    dialog.showModal()
    return
  }
  if (event.target.closest('[data-lightbox-prev]')) showLightboxImage(lightboxIndex - 1)
  else if (event.target.closest('[data-lightbox-next]')) showLightboxImage(lightboxIndex + 1)
  else if (event.target === dialog || event.target.closest('#lightbox figure') && !event.target.closest('img')) dialog.close()
})

document.addEventListener('keydown', (event) => {
  const dialog = document.getElementById('lightbox')
  if (!dialog?.open) return
  if (event.key === 'ArrowLeft') showLightboxImage(lightboxIndex - 1)
  if (event.key === 'ArrowRight') showLightboxImage(lightboxIndex + 1)
})

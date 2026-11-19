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

// The group id lives in the URL (?group=<uuid>) so the link can be shared.
const PARAM = 'group'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readGroupId(): string | null {
  return new URLSearchParams(window.location.search).get(PARAM)
}

export function isValidGroupId(id: string): boolean {
  return UUID_RE.test(id)
}

export function groupLink(id: string): string {
  const url = new URL(window.location.pathname, window.location.origin)
  url.searchParams.set(PARAM, id)
  return url.toString()
}

export function navigateToGroup(id: string | null) {
  const url = id ? groupLink(id) : window.location.pathname
  window.history.pushState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

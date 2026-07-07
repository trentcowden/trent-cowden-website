export const prerender = false

import type { APIRoute } from 'astro'

/**
 * Redirects to a prefilled Mail-to-Things `mailto:` so a visitor can assign a
 * task. The Things address is a secret token, so it's read from env and only
 * ever appears in the redirect's Location header — never in the public HTML.
 */
export const GET: APIRoute = ({ url }) => {
  const to = import.meta.env.THINGS_EMAIL || process.env.THINGS_EMAIL
  if (!to) {
    return new Response('Task assignment is not configured.', { status: 503 })
  }

  // Optional project context from a heading page (email lands in the Inbox and
  // can't set a heading, so we pass it as a note the owner can triage on).
  const project = url.searchParams.get('project')?.trim()
  const note = [
    project && `Suggested project: ${project}`,
    'Assigned via trentcowden.com/work',
  ]
    .filter(Boolean)
    .join('\n')

  const mailto = `mailto:${to}?subject=&body=${encodeURIComponent(note)}`
  return new Response(null, {
    status: 302,
    headers: { Location: mailto, 'X-Robots-Tag': 'noindex' },
  })
}

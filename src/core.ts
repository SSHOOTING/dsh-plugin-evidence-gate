/**
 * Pure, dependency-free core for dsh-plugin-evidence-gate (Evidence Acceptance Gate).
 * Reads only metadata from session events; never prompts, tool bodies or file contents.
 */

const SECRET_RE = /((?:token|key|secret|password|authorization|bearer)[^\s:=]{0,24}[:=]\s*)[^\s&]+/gi
const QUERY_RE = /([?&](?:token|key|secret|password|auth)=)[^&#\s]+/gi
/** Strip credential-looking substrings before anything is printed. */
export function redact(value: unknown): string {
  const text = value instanceof Error ? value.stack || value.message : String(value)
  return text.replace(SECRET_RE, '$1[redacted]').replace(QUERY_RE, '$1[redacted]')
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const STRONG = /\b(pass|passed|ok|green|success|exit\s*0|test|diff|commit|hash|sha|file|http\s*200)\b/i

export function analyze(events: readonly unknown[]): any {
  const list = Array.isArray(events) ? events : []
  const evidence: any[] = []
  let claims = 0
  for (const e of list) {
    if (!isRecord(e) || !isRecord(e.data)) continue
    const t = typeof e.type === 'string' ? e.type : ''
    const payload = typeof e.data.text === 'string' ? e.data.text
      : typeof e.data.output === 'string' ? e.data.output
      : typeof e.data.result === 'string' ? e.data.result : ''
    if (t.includes('tool/result') || t.includes('test') || t.includes('shell')) {
      evidence.push({ source: t, strong: STRONG.test(payload) })
    } else if (t.includes('assistant') && /\b(done|complete|finished)\b/i.test(payload)) {
      claims++
    }
  }
  const strong = evidence.filter(e => e.strong).length
  const verdict = strong > 0 ? 'evidenced' : claims > 0 ? 'claim-only' : 'no-signal'
  return { sampledEvents: list.length, evidence, strong, weak: evidence.length - strong, claims, verdict, passed: strong > 0 }
}

export function formatReport(a: any, opts: { json?: boolean } = {}): string {
  if (opts.json) return JSON.stringify(a, null, 2)
  const head = '[evidence-gate] ' + a.strong + ' strong / ' + a.weak + ' weak evidence · ' +
    a.claims + ' completion claim(s) · ' + a.verdict.toUpperCase()
  const lines = a.evidence.slice(0, 12).map(e =>
    '  ' + (e.strong ? '✓' : '·') + ' ' + redact(e.source))
  return [head, ...lines].join('\n') + (a.passed ? '' : '\nNo strong evidence — do not mark complete.')
}

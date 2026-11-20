import { analyze, formatReport } from './core.js'

export const name = 'dsh-plugin-evidence-gate'
/** The command registry is the only host service we activate. */
export const inject = ['commands']

interface CommandContext {
  commands: {
    register(command: {
      name: string
      description: string
      input?: { hint?: string }
      handler: (args: { agent?: { session?: { events?: readonly unknown[] } }; rawInput?: string }) =>
        | { kind: 'success'; text: string }
        | { kind: 'error'; text: string }
    }): () => void
  }
  /** Cordis lifecycle scope; registers disposables so disable/reload leaves no duplicate command. */
  effect?: (body: () => Generator, label?: string) => void
  logger?: { info?: (message: string) => void; warn?: (message: string) => void }
}

/**
 * Cordis bundle entry. Registers /evidence-gate, a read-only evidence acceptance gate view.
 */
export function apply(ctx: CommandContext, config?: unknown): void {
  const dispose = ctx.commands.register({
    name: 'evidence-gate',
    description: "At task end, show requirement → evidence → verdict line by line. No test result, file diff or cited source means not done — model claims do not count.",
    input: { hint: '[--json]' },
    handler: ({ agent, rawInput }) => {
      try {
        const events = Array.isArray(agent?.session?.events) ? agent.session.events : []
        const summary = analyze(events)
        const json = (rawInput ?? '').trim() === '--json'
        return { kind: 'success', text: formatReport(summary, { json }) }
      } catch (error) {
        return { kind: 'error', text: `[evidence-gate] failed: ${error instanceof Error ? error.message : String(error)}` }
      }
    },
  })

  if (typeof ctx.effect === 'function') {
    ctx.effect(function* () { yield dispose }, `${name} lifecycle`)
  }

  ctx.logger?.info?.('[dsh-plugin-evidence-gate] loaded (read-only; /evidence-gate available)')
}

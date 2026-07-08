import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * A tiny, chainable Supabase test double. It records every query so tests can
 * assert on the table, operation, payload, and filters (including the
 * `user_id` scoping that backs our RLS model), without hitting a real database.
 */

export interface Capture {
  table: string
  op: 'select' | 'insert' | 'update' | 'delete'
  payload?: Record<string, unknown>
  filters: Record<string, unknown>
}

type Resolver = (capture: Capture) => {
  data?: unknown
  error?: { message: string } | null
  count?: number
}

export function createMockClient(resolver: Resolver): {
  client: SupabaseClient
  captures: Capture[]
} {
  const captures: Capture[] = []

  const from = (table: string) => {
    const capture: Capture = { table, op: 'select', filters: {} }
    let resolved = false

    const resolve = () => {
      if (!resolved) {
        captures.push(capture)
        resolved = true
      }
      const r = resolver(capture)
      return { data: r.data ?? null, error: r.error ?? null, count: r.count }
    }

    const builder: Record<string, unknown> = {}
    const chain = () => builder

    builder.select = () => chain()
    builder.insert = (payload: Record<string, unknown>) => {
      capture.op = 'insert'
      capture.payload = payload
      return chain()
    }
    builder.update = (payload: Record<string, unknown>) => {
      capture.op = 'update'
      capture.payload = payload
      return chain()
    }
    builder.delete = () => {
      capture.op = 'delete'
      return chain()
    }
    builder.eq = (key: string, value: unknown) => {
      capture.filters[key] = value
      return chain()
    }
    builder.gte = () => chain()
    builder.lte = () => chain()
    builder.lt = () => chain()
    builder.gt = () => chain()
    builder.in = () => chain()
    builder.order = () => chain()
    builder.limit = () => chain()
    builder.single = async () => resolve()
    builder.maybeSingle = async () => resolve()
    // Make the builder awaitable for terminal, non-single() queries.
    builder.then = (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve()).then(onFulfilled, onRejected)

    return builder
  }

  return { client: { from } as unknown as SupabaseClient, captures }
}

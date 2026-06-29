import { NextResponse } from 'next/server'

/** REST surface for tasks (optional). Implemented in a later milestone. */
export async function GET() {
  return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
}

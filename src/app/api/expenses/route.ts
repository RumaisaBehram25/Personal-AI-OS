import { NextResponse } from 'next/server'

/** REST surface for expenses (optional). Implemented in a later milestone. */
export async function GET() {
  return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
}

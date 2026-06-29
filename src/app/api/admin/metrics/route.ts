import { NextResponse } from 'next/server'

/** Platform metrics for the admin dashboard. Implemented in a later milestone. */
export async function GET() {
  return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
}

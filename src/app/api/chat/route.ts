import { NextResponse } from 'next/server'

export const maxDuration = 30

/**
 * AI chat endpoint. Implemented in the AI core milestone: it will authenticate
 * the user, gather tools from the module registry, and stream a tool-calling
 * response via the Vercel AI SDK. Stubbed for now so the app builds.
 */
export async function POST() {
  return NextResponse.json({ error: 'Not implemented yet' }, { status: 501 })
}

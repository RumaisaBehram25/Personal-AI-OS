/**
 * Supabase database types.
 *
 * Placeholder until generated from the live project:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * The loose typing keeps the app compiling while giving the Supabase clients a
 * generic to attach to.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string | null
  created_at: string
  updated_at: string
}

export interface CreateNoteInput {
  title?: string | null
  content: string
}

export interface UpdateNoteInput {
  title?: string | null
  content?: string
}

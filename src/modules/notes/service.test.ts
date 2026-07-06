import { describe, it, expect } from 'vitest'
import { createMockClient } from '@/test/mock-supabase'
import * as noteService from './service'

const USER = 'user-123'

describe('notes service', () => {
  it('createNote saves a user-scoped note', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 'n1', content: 'Meeting with John on Friday' },
    }))

    const note = await noteService.createNote(client, USER, {
      content: 'Meeting with John on Friday',
    })

    expect(note.id).toBe('n1')
    expect(captures[0].table).toBe('notes')
    expect(captures[0].op).toBe('insert')
    expect(captures[0].payload).toMatchObject({
      user_id: USER,
      content: 'Meeting with John on Friday',
    })
  })

  it('updateNote patches only provided fields', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 'n1', content: 'Updated' },
    }))

    await noteService.updateNote(client, USER, 'n1', { content: 'Updated' })

    expect(captures[0].op).toBe('update')
    expect(captures[0].payload).toEqual({ content: 'Updated' })
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 'n1' })
  })

  it('deleteNote is scoped to user and id', async () => {
    const { client, captures } = createMockClient(() => ({ data: null }))

    await noteService.deleteNote(client, USER, 'n1')

    expect(captures[0].op).toBe('delete')
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 'n1' })
  })
})

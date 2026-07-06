import { describe, it, expect } from 'vitest'
import { createMockClient } from '@/test/mock-supabase'
import * as reminderService from './service'

const USER = 'user-123'

describe('reminders service', () => {
  it('createReminder inserts a user-scoped reminder', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 'r1', message: 'Call dad', remind_at: '2026-07-08T17:00:00.000Z' },
    }))

    const reminder = await reminderService.createReminder(client, USER, {
      message: 'Call dad',
      remindAt: '2026-07-08T17:00:00.000Z',
    })

    expect(reminder.id).toBe('r1')
    expect(captures[0].table).toBe('reminders')
    expect(captures[0].op).toBe('insert')
    expect(captures[0].payload).toMatchObject({
      user_id: USER,
      message: 'Call dad',
      remind_at: '2026-07-08T17:00:00.000Z',
      channel: 'in_app',
    })
  })

  it('updateReminder patches only provided fields', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 'r1', message: 'Call mom' },
    }))

    await reminderService.updateReminder(client, USER, 'r1', {
      message: 'Call mom',
    })

    expect(captures[0].op).toBe('update')
    expect(captures[0].payload).toEqual({ message: 'Call mom' })
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 'r1' })
  })

  it('deleteReminder is scoped to user and id', async () => {
    const { client, captures } = createMockClient(() => ({ data: null }))

    await reminderService.deleteReminder(client, USER, 'r1')

    expect(captures[0].op).toBe('delete')
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 'r1' })
  })

  it('listReminders filters by the current user', async () => {
    const { client, captures } = createMockClient(() => ({
      data: [{ id: 'r1' }],
    }))

    const reminders = await reminderService.listReminders(client, USER, {
      upcomingOnly: true,
    })

    expect(reminders).toHaveLength(1)
    expect(captures[0].filters.user_id).toBe(USER)
  })
})

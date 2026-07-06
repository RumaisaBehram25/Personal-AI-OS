import { describe, it, expect } from 'vitest'
import { createMockClient } from '@/test/mock-supabase'
import * as taskService from './service'

const USER = 'user-123'

describe('tasks service', () => {
  it('createTask inserts a user-scoped row into tasks', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 't1', title: 'Renew license', status: 'pending' },
    }))

    const task = await taskService.createTask(client, USER, {
      title: 'Renew license',
      dueAt: '2026-07-10T09:00:00.000Z',
    })

    expect(task.id).toBe('t1')
    expect(captures[0].table).toBe('tasks')
    expect(captures[0].op).toBe('insert')
    expect(captures[0].payload).toMatchObject({
      user_id: USER,
      title: 'Renew license',
      due_at: '2026-07-10T09:00:00.000Z',
    })
  })

  it('completeTask sets status and completed_at', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 't1', status: 'completed' },
    }))

    await taskService.completeTask(client, USER, 't1')

    expect(captures[0].op).toBe('update')
    expect(captures[0].payload?.status).toBe('completed')
    expect(captures[0].payload?.completed_at).toBeTruthy()
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 't1' })
  })

  it('updateTask only patches provided fields', async () => {
    const { client, captures } = createMockClient(() => ({
      data: { id: 't1', title: 'New title' },
    }))

    await taskService.updateTask(client, USER, 't1', { title: 'New title' })

    expect(captures[0].payload).toEqual({ title: 'New title' })
    expect(captures[0].payload).not.toHaveProperty('status')
  })

  it('deleteTask is scoped to user and id', async () => {
    const { client, captures } = createMockClient(() => ({ data: null }))

    await taskService.deleteTask(client, USER, 't1')

    expect(captures[0].op).toBe('delete')
    expect(captures[0].filters).toMatchObject({ user_id: USER, id: 't1' })
  })

  it('listTasks filters by the current user', async () => {
    const { client, captures } = createMockClient(() => ({
      data: [{ id: 't1' }, { id: 't2' }],
    }))

    const tasks = await taskService.listTasks(client, USER, {
      status: 'pending',
    })

    expect(tasks).toHaveLength(2)
    expect(captures[0].op).toBe('select')
    expect(captures[0].filters.user_id).toBe(USER)
  })

  it('surfaces database errors', async () => {
    const { client } = createMockClient(() => ({
      error: { message: 'boom' },
    }))

    await expect(
      taskService.createTask(client, USER, { title: 'x' }),
    ).rejects.toThrow('boom')
  })
})

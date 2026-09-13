'use server'

import { db } from '@/lib/db'
import { tasks, taskLogs } from '@/lib/db/schema'
import { getCurrentUser } from './auth'
import { isTaskScheduledForDate } from '@/lib/recurrence'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getTasksForDate(dateStr: string) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized', tasks: [] }

  try {
    // 1. Fetch user's non-archived tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.isArchived, false)))

    // 2. Filter tasks occurring on dateStr
    const activeForDate = userTasks.filter((task) => isTaskScheduledForDate(task, dateStr))

    if (activeForDate.length === 0) {
      return { success: true, tasks: [] }
    }

    // 3. Fetch completion logs for user on dateStr
    const taskIds = activeForDate.map((t) => t.id)
    const logs = await db
      .select()
      .from(taskLogs)
      .where(
        and(
          eq(taskLogs.userId, user.id),
          eq(taskLogs.dateStr, dateStr),
          inArray(taskLogs.taskId, taskIds)
        )
      )

    const completedSet = new Set(logs.map((l) => l.taskId))

    const formattedTasks = activeForDate.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      time: t.scheduledTime,
      duration: t.duration,
      done: completedSet.has(t.id),
      priority: t.priority as 'High' | 'Medium' | 'Low',
      recurrenceType: t.recurrenceType,
    }))

    return { success: true, tasks: formattedTasks }
  } catch (error) {
    console.error('Error fetching tasks for date:', error)
    return { success: false, error: 'Failed to fetch tasks', tasks: [] }
  }
}

export async function toggleTaskCompletion(taskId: number, dateStr: string, isCurrentlyDone: boolean) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    if (isCurrentlyDone) {
      // Remove log for dateStr
      await db
        .delete(taskLogs)
        .where(
          and(
            eq(taskLogs.taskId, taskId),
            eq(taskLogs.userId, user.id),
            eq(taskLogs.dateStr, dateStr)
          )
        )
    } else {
      // Add completion log for dateStr
      await db.insert(taskLogs).values({
        taskId,
        userId: user.id,
        dateStr,
      })
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error toggling task completion:', error)
    return { success: false, error: 'Failed to update task' }
  }
}

export async function createHabit(data: {
  title: string
  category?: string
  scheduledTime?: string
  duration?: string
  priority?: string
  recurrenceType?: string
  recurrenceDays?: string
  scheduledDate?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  if (!data.title || !data.title.trim()) {
    return { success: false, error: 'Title is required' }
  }

  try {
    const todayDefaultStr = new Date().toISOString().slice(0, 10)
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title: data.title.trim(),
        category: data.category || 'General',
        scheduledTime: data.scheduledTime || '08:00 AM',
        duration: data.duration || '30 min',
        priority: data.priority || 'Medium',
        recurrenceType: data.recurrenceType || 'daily',
      })
      .returning()

    revalidatePath('/')
    return { success: true, task: newTask }
  } catch (error) {
    console.error('Error creating habit detail:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create habit' }
  }
}

export async function deleteTask(taskId: number) {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

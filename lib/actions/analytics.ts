'use server'

import { db } from '@/lib/db'
import { tasks, taskLogs } from '@/lib/db/schema'
import { getCurrentUser } from './auth'
import { isTaskScheduledForDate } from '@/lib/recurrence'
import { eq, and, gte, lte } from 'drizzle-orm'

export async function getAnalyticsData(period: 'week' | 'month' = 'week') {
  const user = await getCurrentUser()
  if (!user) return null

  try {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    const numDays = period === 'week' ? 7 : 30
    const startDate = new Date()
    startDate.setDate(today.getDate() - (numDays - 1))
    const startDateStr = startDate.toISOString().slice(0, 10)

    // 1. Fetch user tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, user.id), eq(tasks.isArchived, false)))

    // 2. Fetch logs in date range
    const userLogs = await db
      .select()
      .from(taskLogs)
      .where(
        and(
          eq(taskLogs.userId, user.id),
          gte(taskLogs.dateStr, startDateStr),
          lte(taskLogs.dateStr, todayStr)
        )
      )

    // Group logs by date
    const logsByDateMap = new Map<string, Set<number>>()
    userLogs.forEach((log) => {
      if (!logsByDateMap.has(log.dateStr)) {
        logsByDateMap.set(log.dateStr, new Set())
      }
      logsByDateMap.get(log.dateStr)!.add(log.taskId)
    })

    // Calculate daily consistency
    let totalScheduledCount = 0
    let totalCompletedCount = 0
    let consistentDaysCount = 0

    const dailyBreakdown: Array<{ date: string; dayLabel: string; percentage: number; total: number; completed: number }> = []

    for (let i = 0; i < numDays; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })

      const scheduledForDay = userTasks.filter((t) => isTaskScheduledForDate(t, dStr))
      const completedForDaySet = logsByDateMap.get(dStr) || new Set()

      const scheduledCount = scheduledForDay.length
      const completedCount = scheduledForDay.filter((t) => completedForDaySet.has(t.id)).length

      totalScheduledCount += scheduledCount
      totalCompletedCount += completedCount

      const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 100

      if (scheduledCount > 0 && completedCount === scheduledCount) {
        consistentDaysCount++
      }

      dailyBreakdown.push({
        date: dStr,
        dayLabel,
        percentage: pct,
        total: scheduledCount,
        completed: completedCount,
      })
    }

    const overallConsistency = totalScheduledCount > 0 ? Math.round((totalCompletedCount / totalScheduledCount) * 100) : 0

    // Streak calculation (consecutive perfect days leading up to today)
    let currentStreak = 0
    let checkDate = new Date()
    while (true) {
      const cStr = checkDate.toISOString().slice(0, 10)
      const scheduledForDay = userTasks.filter((t) => isTaskScheduledForDate(t, cStr))
      if (scheduledForDay.length === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }
      const completedSet = logsByDateMap.get(cStr) || new Set()
      const isPerfect = scheduledForDay.every((t) => completedSet.has(t.id))
      if (isPerfect) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return {
      period,
      overallConsistency,
      totalScheduledCount,
      totalCompletedCount,
      consistentDaysCount,
      currentStreak,
      dailyBreakdown,
    }
  } catch (error) {
    console.error('Error computing analytics data:', error)
    return null
  }
}

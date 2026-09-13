import { Task } from './db/schema'

export function isTaskScheduledForDate(task: Task, targetDateStr: string): boolean {
  const targetDate = new Date(targetDateStr + 'T00:00:00')
  const dayOfWeekNum = targetDate.getDay() // 0 = Sun, 6 = Sat
  const createdAtDateStr = task.createdAt.toISOString().slice(0, 10)

  // Start date constraint (cannot appear before task creation)
  if (targetDateStr < createdAtDateStr) return false

  // Recurrence type logic
  switch (task.recurrenceType) {
    case 'none': {
      return targetDateStr === createdAtDateStr
    }

    case 'daily':
      return true

    case 'weekdays':
      // Monday (1) to Friday (5)
      return dayOfWeekNum >= 1 && dayOfWeekNum <= 5

    case 'weekly': {
      const baseDate = new Date(createdAtDateStr + 'T00:00:00')
      return targetDate.getDay() === baseDate.getDay()
    }

    case 'monthly': {
      const baseDate = new Date(createdAtDateStr + 'T00:00:00')
      return targetDate.getDate() === baseDate.getDate()
    }

    default:
      return true
  }
}

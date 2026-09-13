import { pgTable, serial, text, boolean, timestamp, integer, date } from 'drizzle-orm/pg-core'

// 0. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 1. Tasks / Habits Table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default('General'),
  scheduledTime: text('scheduled_time').notNull().default('08:00 AM'),
  duration: text('duration').notNull().default('30 min'),
  priority: text('priority').notNull().default('Medium'),
  recurrenceType: text('recurrence_type').notNull().default('none'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 2. Daily Task Completion Logs
export const taskLogs = pgTable('task_logs', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .references(() => tasks.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  dateStr: date('date_str').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  note: text('note'),
})

// 3. User Streaks & Aggregate Stats
export const userStats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').notNull().default(0),
  bestStreak: integer('best_streak').notNull().default(0),
  totalTasksCompleted: integer('total_tasks_completed').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskLog = typeof taskLogs.$inferSelect
export type NewTaskLog = typeof taskLogs.$inferInsert
export type UserStats = typeof userStats.$inferSelect

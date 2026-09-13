'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  Plus,
  Search,
  Settings,
  Target,
  TrendingUp,
  X,
  LogOut,
  Trash2,
} from 'lucide-react'
import { getTasksForDate, toggleTaskCompletion, createHabit, deleteTask } from '@/lib/actions/tasks'
import { getAnalyticsData } from '@/lib/actions/analytics'
import { logoutUser, getCurrentUser } from '@/lib/actions/auth'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { setUser, clearUser } from '@/lib/store/userSlice'

type Task = {
  id: number
  title: string
  description?: string
  category: string
  time: string
  duration: string
  done: boolean
  priority: 'High' | 'Medium' | 'Low'
  recurrenceType?: string
}

type Analytics = {
  period: string
  overallConsistency: number
  totalScheduledCount: number
  totalCompletedCount: number
  consistentDaysCount: number
  currentStreak: number
  dailyBreakdown: Array<{ date: string; dayLabel: string; percentage: number; total: number; completed: number }>
}

const nav = [
  { label: 'Today', icon: CalendarDays },
  { label: 'Timeline', icon: Clock3 },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Trends', icon: TrendingUp },
  { label: 'Settings', icon: Settings },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Check size={21} strokeWidth={3} />
      </div>
      <div>
        <strong>Consistent</strong>
        <span>Build your rhythm</span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Flame
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <b>{value}</b>
      <small>{detail}</small>
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <article className={`task-row ${task.done ? 'complete' : ''}`}>
      <button
        className={`check ${task.done ? 'checked' : ''}`}
        aria-label={`Mark ${task.title} ${task.done ? 'incomplete' : 'complete'}`}
        onClick={onToggle}
      >
        {task.done && <Check size={16} />}
      </button>
      <div className="task-copy">
        <h3>{task.title}</h3>
        <p>
          <Clock3 size={13} /> {task.time} <i>•</i> {task.duration} <i>•</i>{' '}
          <span className="repeat">↻ {task.recurrenceType || 'Daily'}</span>
        </p>
        {task.done ? (
          <div className="task-status">
            <Check size={14} /> Completed
          </div>
        ) : (
          <div className="task-status upcoming">Scheduled</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`tag ${task.category.toLowerCase()}`}>{task.category}</span>
        <button
          onClick={onDelete}
          className="text-slate-500 hover:text-rose-400 p-1 transition"
          title="Delete habit"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  )
}

function TodayView({
  tasks,
  toggle,
  onDelete,
  onAdd,
  analytics,
  userName,
  selectedDate,
  onDateChange,
}: {
  tasks: Task[]
  toggle: (id: number, done: boolean) => void
  onDelete: (id: number) => void
  onAdd: () => void
  analytics: Analytics | null
  userName: string
  selectedDate: string
  onDateChange: (date: string) => void
}) {
  const completed = tasks.filter((t) => t.done).length
  const dateObj = new Date(selectedDate + 'T00:00:00')
  const formattedDateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  const progressPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  return (
    <>
      <header className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="eyebrow m-0">
              {formattedDateStr} <span>• Routine</span>
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-emerald-400 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
          <h1>
            Welcome back,
            <br />
            <em>{userName || 'User'}</em>
          </h1>
          <p className="quote">“Don&apos;t just manage tasks. Build consistency.”</p>
        </div>
        <button className="primary add cursor-pointer" onClick={onAdd}>
          <Plus size={18} /> Habit
        </button>
      </header>

      {analytics && (
        <div className="milestone">
          <span className="milestone-icon">
            <Flame size={19} />
          </span>
          <span>
            You have a <b>{analytics.currentStreak}-day streak</b> active!
          </span>
          <ChevronRight size={20} />
        </div>
      )}

      <section className="metrics">
        <Metric
          label="Day Progress"
          value={`${progressPct}%`}
          detail={`${completed} of ${tasks.length} · ${tasks.length - completed} left`}
          icon={Target}
        />
        <Metric
          label="Current Streak"
          value={`${analytics?.currentStreak || 0} days`}
          detail="Live count"
          icon={Flame}
        />
        <Metric
          label="Consistency"
          value={`${analytics?.overallConsistency || 0}%`}
          detail="Calculated from logs"
          icon={TrendingUp}
        />
        <Metric
          label="Total Completed"
          value={`${analytics?.totalCompletedCount || 0}`}
          detail="Recent period"
          icon={Clock3}
        />
      </section>

      <section className="section-head">
        <h2>
          Routine for {selectedDate} <span>{tasks.length} tasks</span>
        </h2>
      </section>

      {tasks.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <p className="text-sm font-medium">No habits scheduled for {selectedDate}.</p>
          <p className="text-xs text-slate-500 mt-1">Click &quot;+ Habit&quot; above to add a routine!</p>
        </div>
      ) : (
        <section className="tasks">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggle(task.id, task.done)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </section>
      )}
    </>
  )
}

function TrendsView({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) {
    return (
      <div className="card text-center py-12 text-slate-400">
        <p>Loading analytics from live logs...</p>
      </div>
    )
  }

  return (
    <>
      <header className="page-header compact">
        <div>
          <p className="eyebrow">Your momentum at a deliberate glance</p>
          <h1>
            Consistency &<br />
            <em>Streaks</em>
          </h1>
        </div>
      </header>

      <section className="hero-stat">
        <div>
          <small>ACTIVE RHYTHM</small>
          <strong>{analytics.currentStreak} Days</strong>
          <p>◉ Consistent days logged: {analytics.consistentDaysCount}</p>
        </div>
        <span className="flow">↯ In Flow</span>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h2>Recent Breakdown</h2>
            <small>Live Database Analytics</small>
          </div>
          <span className="pill green">◉ Realtime</span>
        </div>
        <div className="breakdown">
          <strong>
            {analytics.overallConsistency}%<small>Consistency</small>
          </strong>
          <strong>
            {analytics.totalCompletedCount}
            <small>/{analytics.totalScheduledCount} Tasks Done</small>
          </strong>
        </div>

        <div className="bars">
          {analytics.dailyBreakdown.map((item, i) => (
            <div key={i}>
              <small>{item.percentage}%</small>
              <i style={{ height: `${Math.max(item.percentage, 10)}%` }} />
              <label>{item.dayLabel}</label>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date()
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      <header className="page-header calendar-head">
        <div>
          <h1>
            {monthName.split(' ')[0]}
            <br />
            <em>{monthName.split(' ')[1]}</em>
          </h1>
        </div>
      </header>

      <section className="card day-detail">
        <div className="section-head">
          <div>
            <h2>Active Routine</h2>
            <p>{tasks.filter((t) => t.done).length} of {tasks.length} rituals fulfilled</p>
          </div>
        </div>

        {tasks.map((t) => (
          <div className="mini-task" key={t.id}>
            <div>
              <b>{t.title}</b>
              <small>
                {t.time} · {t.category}
              </small>
            </div>
            <strong className={t.done ? '' : 'scheduled'}>
              {t.done ? '✓ Completed' : '○ Scheduled'}
            </strong>
          </div>
        ))}
      </section>
    </>
  )
}

function SettingsView({ user, onLogout }: { user: { name: string | null; email: string | null }; onLogout: () => void }) {
  return (
    <>
      <header className="page-header compact">
        <div>
          <p className="eyebrow">Account & Preferences</p>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="card space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user.name || 'User'}</h2>
            <p className="text-sm text-slate-400">{user.email || 'No email'}</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </section>
    </>
  )
}

function Modal({ close, add }: { close: () => void; add: (data: { title: string; category: string; scheduledTime: string; recurrenceType: string }) => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Learning')
  const [time, setTime] = useState('08:00 AM')
  const [recurrenceType, setRecurrenceType] = useState('daily')

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="close" onClick={close}>
          <X size={18} />
        </button>
        <p className="eyebrow">CREATE HABIT</p>
        <h2>Build a rhythm that sticks.</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (title.trim()) {
              add({ title: title.trim(), category, scheduledTime: time, recurrenceType })
            }
          }}
        >
          <label>
            Task title
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study for 30 minutes"
            />
          </label>
          <label>
            Category
            <div className="category-options">
              {['Learning', 'Health', 'Work', 'Fitness', 'Personal'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={category === cat ? 'active' : ''}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </label>
          <label>
            Time Slot
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white mt-1 cursor-pointer"
            >
              <option value="06:00 AM">06:00 AM (Early Morning)</option>
              <option value="07:00 AM">07:00 AM</option>
              <option value="08:00 AM">08:00 AM (Morning Routine)</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM (Noon)</option>
              <option value="01:00 PM">01:00 PM</option>
              <option value="02:00 PM">02:00 PM (Afternoon Focus)</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="06:00 PM">06:00 PM (Evening)</option>
              <option value="08:00 PM">08:00 PM (Night Routine)</option>
              <option value="10:00 PM">10:00 PM</option>
            </select>
          </label>
          <label className="mt-3">
            Recurrence
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-sm text-white mt-1"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays (Mon-Fri)</option>
              <option value="weekly">Weekly</option>
              <option value="none">One time only</option>
            </select>
          </label>
          <button type="submit" className="primary full cursor-pointer mt-4">
            Create habit
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user)

  const [active, setActive] = useState('Today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [tasks, setTasks] = useState<Task[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch initial profile & dynamic DB tasks for selectedDate
  const loadData = useCallback(async () => {
    setLoading(true)

    // 1. Fetch current user if not in Redux
    const currentUser = await getCurrentUser()
    if (currentUser) {
      dispatch(setUser(currentUser))
    } else {
      router.push('/login')
      return
    }

    // 2. Fetch tasks for selectedDate dynamically from Neon DB
    const res = await getTasksForDate(selectedDate)
    if (res.success) {
      setTasks(res.tasks)
    }

    // 3. Fetch live analytics from Neon DB
    const analyticsRes = await getAnalyticsData('week')
    if (analyticsRes) {
      setAnalytics(analyticsRes)
    }

    setLoading(false)
  }, [dispatch, router, selectedDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggle = async (id: number, isCurrentlyDone: boolean) => {
    // Optimistic UI update
    setTasks((items) => items.map((t) => (t.id === id ? { ...t, done: !isCurrentlyDone } : t)))
    setToast('Routine updated')
    setTimeout(() => setToast(''), 2200)

    await toggleTaskCompletion(id, selectedDate, isCurrentlyDone)
    loadData()
  }

  const handleDelete = async (id: number) => {
    setTasks((items) => items.filter((t) => t.id !== id))
    setToast('Habit deleted')
    setTimeout(() => setToast(''), 2200)

    await deleteTask(id)
    loadData()
  }

  const handleAdd = async (data: { title: string; category: string; scheduledTime: string; recurrenceType: string }) => {
    setModal(false)
    setToast('Adding habit...')

    const res = await createHabit({
      title: data.title,
      category: data.category,
      scheduledTime: data.scheduledTime,
      recurrenceType: data.recurrenceType,
      scheduledDate: selectedDate,
    })

    if (res.success) {
      setToast('Habit added to your rhythm!')
      setTimeout(() => setToast(''), 2200)
      await loadData()
    } else {
      setToast(res.error || 'Failed to add habit')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    dispatch(clearUser())
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const view =
    active === 'Trends' ? (
      <TrendsView analytics={analytics} />
    ) : active === 'Calendar' ? (
      <CalendarView tasks={tasks} />
    ) : active === 'Settings' ? (
      <SettingsView user={user} onLogout={handleLogout} />
    ) : (
      <TodayView
        tasks={tasks}
        toggle={toggle}
        onDelete={handleDelete}
        onAdd={() => setModal(true)}
        analytics={analytics}
        userName={user.name || ''}
        selectedDate={selectedDate}
        onDateChange={(d) => setSelectedDate(d)}
      />
    )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              className={active === label ? 'active' : ''}
              key={label}
              onClick={() => setActive(label)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setActive('Settings')}>
            <CircleHelp size={17} /> Settings
          </button>
          <div className="profile">
            <div className="avatar">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <span>
              <b>{user.name || 'User'}</b>
              <small>{user.email || 'Account'}</small>
            </span>
            <Settings size={16} onClick={() => setActive('Settings')} className="cursor-pointer" />
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <Brand />
          <div className="top-actions">
            <button aria-label="Search">
              <Search size={19} />
            </button>
            <div className="avatar">{user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}</div>
          </div>
        </div>
        <div className="content">{view}</div>
      </main>

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}

      {modal && <Modal close={() => setModal(false)} add={handleAdd} />}

      <nav className="bottom-nav">
        {nav.map(({ label, icon: Icon }) => (
          <button
            className={active === label ? 'active' : ''}
            key={label}
            onClick={() => setActive(label)}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

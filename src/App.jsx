import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'mushfik-arman-todo-live-board'

const categories = ['All', 'Inbox', 'Today', 'Work', 'Personal']
const priorities = ['Low', 'Normal', 'High']
const statuses = ['All', 'Open', 'Done']
const sorts = ['Smart', 'Due', 'Priority', 'Newest']
const legacyLaneMap = {
  Ideas: 'Inbox',
  Build: 'Work',
  Launch: 'Today',
}

const sampleTasks = [
  {
    id: 1,
    title: 'Finish UI polish',
    note: 'Small spacing, clean cards, mobile check.',
    category: 'Today',
    priority: 'High',
    due: new Date().toISOString().slice(0, 10),
    done: false,
    pinned: true,
    createdAt: '2026-06-24T17:00:00.000Z',
  },
  {
    id: 2,
    title: 'Plan next feature',
    note: 'Keep it simple and useful.',
    category: 'Work',
    priority: 'Normal',
    due: '',
    done: false,
    pinned: false,
    createdAt: '2026-06-24T17:30:00.000Z',
  },
  {
    id: 3,
    title: 'Clean completed items',
    note: '',
    category: 'Inbox',
    priority: 'Low',
    due: '',
    done: true,
    pinned: false,
    createdAt: '2026-06-24T18:00:00.000Z',
  },
]

const blankDraft = {
  title: '',
  note: '',
  category: 'Inbox',
  priority: 'Normal',
  due: '',
}

function normalizeTask(task, index) {
  const category = legacyLaneMap[task.lane] ?? task.category

  return {
    id: task.id ?? Date.now() + index,
    title: task.title ?? 'Untitled task',
    note: task.note ?? task.detail ?? '',
    category: categories.includes(category) && category !== 'All' ? category : 'Inbox',
    priority: priorities.includes(task.priority) ? task.priority : 'Normal',
    due: task.due ?? '',
    done: Boolean(task.done),
    pinned: Boolean(task.pinned),
    createdAt: task.createdAt ?? new Date().toISOString(),
  }
}

function readStoredTasks() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return sampleTasks
  }

  try {
    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) ? parsed.map(normalizeTask) : sampleTasks
  } catch {
    return sampleTasks
  }
}

function isToday(value) {
  return value === new Date().toISOString().slice(0, 10)
}

function isOverdue(task) {
  return task.due && !task.done && task.due < new Date().toISOString().slice(0, 10)
}

function priorityScore(priority) {
  return { High: 3, Normal: 2, Low: 1 }[priority] ?? 2
}

function formatDue(value) {
  if (!value) {
    return 'Anytime'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function App() {
  const [tasks, setTasks] = useState(readStoredTasks)
  const [draft, setDraft] = useState(blankDraft)
  const [editingId, setEditingId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('Open')
  const [sortBy, setSortBy] = useState('Smart')
  const [query, setQuery] = useState('')
  const [compact, setCompact] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.done).length
    const overdue = tasks.filter(isOverdue).length
    const today = tasks.filter((task) => task.due && isToday(task.due) && !task.done).length

    return {
      total: tasks.length,
      open: tasks.length - done,
      done,
      overdue,
      today,
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    }
  }, [tasks])

  const visibleTasks = useMemo(() => {
    const text = query.trim().toLowerCase()
    const filtered = tasks.filter((task) => {
      const matchesCategory =
        categoryFilter === 'All' || task.category === categoryFilter
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Open' && !task.done) ||
        (statusFilter === 'Done' && task.done)
      const matchesQuery =
        !text ||
        task.title.toLowerCase().includes(text) ||
        task.note.toLowerCase().includes(text)

      return matchesCategory && matchesStatus && matchesQuery
    })

    return [...filtered].sort((first, second) => {
      if (first.pinned !== second.pinned) {
        return first.pinned ? -1 : 1
      }

      if (first.done !== second.done) {
        return first.done ? 1 : -1
      }

      if (sortBy === 'Due') {
        return (first.due || '9999-12-31').localeCompare(second.due || '9999-12-31')
      }

      if (sortBy === 'Priority') {
        return priorityScore(second.priority) - priorityScore(first.priority)
      }

      if (sortBy === 'Newest') {
        return new Date(second.createdAt) - new Date(first.createdAt)
      }

      const firstSmart =
        priorityScore(first.priority) * 10 -
        (first.due ? Math.max(0, new Date(first.due) - new Date()) / 86400000 : 30)
      const secondSmart =
        priorityScore(second.priority) * 10 -
        (second.due ? Math.max(0, new Date(second.due) - new Date()) / 86400000 : 30)

      return secondSmart - firstSmart
    })
  }, [categoryFilter, query, sortBy, statusFilter, tasks])

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setDraft(blankDraft)
    setEditingId(null)
  }

  function handleSubmit(event) {
    event.preventDefault()

    const title = draft.title.trim()
    const note = draft.note.trim()

    if (!title) {
      return
    }

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId ? { ...task, ...draft, title, note } : task,
        ),
      )
      resetForm()
      return
    }

    setTasks((current) => [
      {
        id: Date.now(),
        ...draft,
        title,
        note,
        done: false,
        pinned: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    resetForm()
  }

  function editTask(task) {
    setEditingId(task.id)
    setDraft({
      title: task.title,
      note: task.note,
      category: task.category,
      priority: task.priority,
      due: task.due,
    })
  }

  function patchTask(taskId, patch) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    )
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId))

    if (editingId === taskId) {
      resetForm()
    }
  }

  function addQuickTask() {
    setTasks((current) => [
      {
        id: Date.now(),
        title: 'Quick task',
        note: '',
        category: 'Inbox',
        priority: 'Normal',
        due: '',
        done: false,
        pinned: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
  }

  function completeVisible() {
    const visibleIds = new Set(visibleTasks.map((task) => task.id))

    setTasks((current) =>
      current.map((task) =>
        visibleIds.has(task.id) ? { ...task, done: true } : task,
      ),
    )
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => !task.done))
  }

  return (
    <main className={`app-shell ${compact ? 'compact' : ''}`}>
      <div className="todo-background" aria-hidden="true">
        <span className="bg-board board-a">
          <i />
          <i />
          <i />
        </span>
        <span className="bg-board board-b">
          <i />
          <i />
          <i />
        </span>
        <span className="bg-board board-c">
          <i />
          <i />
          <i />
        </span>
        <span className="bg-check check-a" />
        <span className="bg-check check-b" />
        <span className="bg-cube cube-a" />
        <span className="bg-cube cube-b" />
      </div>

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <h1>Todo</h1>
            <p>{stats.progress}% done</p>
          </div>
        </div>

        <div className="progress-track" aria-label={`${stats.progress}% complete`}>
          <span style={{ width: `${stats.progress}%` }} />
        </div>

        <div className="stat-grid" aria-label="Task summary">
          <article>
            <span>{stats.open}</span>
            <p>Open</p>
          </article>
          <article>
            <span>{stats.today}</span>
            <p>Today</p>
          </article>
          <article>
            <span>{stats.overdue}</span>
            <p>Late</p>
          </article>
          <article>
            <span>{stats.done}</span>
            <p>Done</p>
          </article>
        </div>

        <div className="nav-group" role="tablist" aria-label="Category filter">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={categoryFilter === item ? 'active' : ''}
              onClick={() => setCategoryFilter(item)}
            >
              <span>{item}</span>
              <small>
                {item === 'All'
                  ? tasks.length
                  : tasks.filter((task) => task.category === item).length}
              </small>
            </button>
          ))}
        </div>

        <div className="task-orbit" aria-hidden="true">
          <div className="orbit-ring" />
          <span className="orbit-card card-one" />
          <span className="orbit-card card-two" />
          <span className="orbit-card card-three" />
          <span className="orbit-core" />
        </div>

      </aside>

      <section className="workbench">
        <header className="toolbar">
          <div>
            <p className="eyebrow">My tasks</p>
            <h2>{stats.open ? `${stats.open} things left` : 'All clear'}</h2>
          </div>

          <div className="toolbar-actions">
            <button type="button" className="icon-button" onClick={addQuickTask} title="Quick add">
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => setCompact((value) => !value)}
              title="Compact view"
            >
              <span aria-hidden="true">=</span>
            </button>
            <button type="button" onClick={completeVisible}>
              Done shown
            </button>
            <button type="button" onClick={clearCompleted}>
              Clear done
            </button>
          </div>
        </header>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft.title}
            onChange={(event) => updateDraft('title', event.target.value)}
            placeholder="Add a task..."
            aria-label="Task title"
          />

          <input
            type="text"
            value={draft.note}
            onChange={(event) => updateDraft('note', event.target.value)}
            placeholder="Note"
            aria-label="Task note"
          />

          <select
            value={draft.category}
            onChange={(event) => updateDraft('category', event.target.value)}
            aria-label="Category"
          >
            {categories
              .filter((item) => item !== 'All')
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>

          <select
            value={draft.priority}
            onChange={(event) => updateDraft('priority', event.target.value)}
            aria-label="Priority"
          >
            {priorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={draft.due}
            onChange={(event) => updateDraft('due', event.target.value)}
            aria-label="Due date"
          />

          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && (
            <button type="button" className="ghost-button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>

        <div className="controls">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search tasks"
          />

          <div className="segmented" role="tablist" aria-label="Status filter">
            {statuses.map((item) => (
              <button
                key={item}
                type="button"
                className={statusFilter === item ? 'active' : ''}
                onClick={() => setStatusFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            aria-label="Sort tasks"
          >
            {sorts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="task-list">
          {visibleTasks.length ? (
            visibleTasks.map((task) => (
              <article
                key={task.id}
                className={`task-card priority-${task.priority.toLowerCase()} ${
                  task.done ? 'done' : ''
                } ${task.pinned ? 'pinned' : ''}`}
              >
                <button
                  type="button"
                  className="check-button"
                  onClick={() => patchTask(task.id, { done: !task.done })}
                  aria-label={task.done ? 'Mark open' : 'Mark done'}
                >
                  <span aria-hidden="true">{task.done ? 'x' : ''}</span>
                </button>

                <div className="task-content">
                  <div className="task-line">
                    <h3>{task.title}</h3>
                    <span className={`priority-pill ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>

                  {task.note && <p>{task.note}</p>}

                  <div className="task-meta">
                    <span>{task.category}</span>
                    <span className={isOverdue(task) ? 'danger' : ''}>
                      {formatDue(task.due)}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className={task.pinned ? 'icon-button active' : 'icon-button'}
                    onClick={() => patchTask(task.id, { pinned: !task.pinned })}
                    title={task.pinned ? 'Unpin' : 'Pin'}
                  >
                    <span aria-hidden="true">^</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => editTask(task)}
                    title="Edit"
                  >
                    <span aria-hidden="true">/</span>
                  </button>
                  <button
                    type="button"
                    className="icon-button danger-button"
                    onClick={() => deleteTask(task.id)}
                    title="Delete"
                  >
                    <span aria-hidden="true">x</span>
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>No tasks here</strong>
              <button type="button" onClick={() => setStatusFilter('All')}>
                Show all
              </button>
            </div>
          )}
        </div>

        <footer className="site-footer">
          <div>
            <strong>Todo Dashboard</strong>
            <p>Developed by Mushfik Arman</p>
          </div>
          <div className="footer-meta">
            <span>React + Vite</span>
            <span>All rights reserved (c) {currentYear}</span>
          </div>
        </footer>
      </section>
    </main>
  )
}

export default App

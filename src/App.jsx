import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'mushfik-arman-todo-live-board'

const initialTasks = [
  {
    id: 1,
    title: 'Sketch a bold landing concept',
    detail: 'Pull references and lock the visual direction before coding.',
    lane: 'Ideas',
    done: false,
    createdAt: '2026-06-24T16:30:00.000Z',
  },
  {
    id: 2,
    title: 'Refactor the todo interactions',
    detail: 'Make adding, filtering, and marking complete feel instant.',
    lane: 'Build',
    done: false,
    createdAt: '2026-06-24T17:00:00.000Z',
  },
  {
    id: 3,
    title: 'Ship the final polish pass',
    detail: 'Tighten spacing, states, and microcopy for a cleaner finish.',
    lane: 'Launch',
    done: true,
    createdAt: '2026-06-24T17:30:00.000Z',
  },
]

const lanes = ['All', 'Ideas', 'Build', 'Launch']
const statuses = ['All', 'Open', 'Done']

function readStoredTasks() {
  const saved = localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return initialTasks
  }

  try {
    const parsed = JSON.parse(saved)

    if (!Array.isArray(parsed)) {
      return initialTasks
    }

    return parsed.map((task, index) => ({
      id: task.id ?? Date.now() + index,
      title: task.title ?? 'Untitled task',
      detail:
        task.detail ?? 'No extra notes yet. Add context when you need it.',
      lane: lanes.includes(task.lane) ? task.lane : 'Ideas',
      done: Boolean(task.done),
      createdAt: task.createdAt ?? new Date().toISOString(),
    }))
  } catch {
    return initialTasks
  }
}

function formatClock(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatDateLabel(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function App() {
  const [tasks, setTasks] = useState(readStoredTasks)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [lane, setLane] = useState('Ideas')
  const [filter, setFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const [clock, setClock] = useState(() => formatClock(new Date()))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const visibleTasks = tasks.filter((task) => {
    const matchesLane = filter === 'All' || task.lane === filter
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Done' && task.done) ||
      (statusFilter === 'Open' && !task.done)
    const matchesQuery =
      !normalizedQuery ||
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.detail.toLowerCase().includes(normalizedQuery)

    return matchesLane && matchesStatus && matchesQuery
  })

  const completedCount = tasks.filter((task) => task.done).length
  const activeCount = tasks.length - completedCount
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0
  const todayDoneCount = tasks.filter(
    (task) =>
      task.done &&
      new Date(task.createdAt).toDateString() === new Date().toDateString(),
  ).length

  function handleSubmit(event) {
    event.preventDefault()

    const cleanTitle = title.trim()
    const cleanDetail = detail.trim()

    if (!cleanTitle) {
      return
    }

    setTasks((currentTasks) => [
      {
        id: Date.now(),
        title: cleanTitle,
        detail: cleanDetail || 'No extra notes yet. Add context when you need it.',
        lane,
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...currentTasks,
    ])
    setTitle('')
    setDetail('')
    setLane('Ideas')
  }

  function toggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    )
  }

  function deleteTask(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
  }

  function clearCompleted() {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.done))
  }

  function addQuickTask() {
    const quickIdeas = [
      {
        title: 'Record one wild improvement idea',
        detail: 'Push beyond the first safe version and write the bolder option.',
        lane: 'Ideas',
      },
      {
        title: 'Run a five-minute cleanup sprint',
        detail: 'Fix one rough edge that would bother you again tomorrow.',
        lane: 'Build',
      },
      {
        title: 'Prepare the handoff note',
        detail: 'Summarize what changed so the next session starts fast.',
        lane: 'Launch',
      },
    ]
    const pick = quickIdeas[Math.floor(Math.random() * quickIdeas.length)]

    setTasks((currentTasks) => [
      {
        id: Date.now(),
        ...pick,
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...currentTasks,
    ])
  }

  return (
    <main className={`app-shell ${focusMode ? 'focus-mode' : ''}`}>
      <nav className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Mushfik Arman</p>
          <span className="brand-subtitle">Live board for actual work</span>
        </div>

        <div className="topbar-actions">
          <div className="live-chip">
            <span className="live-dot"></span>
            <strong>{clock}</strong>
          </div>
          <button type="button" onClick={() => setFilter('All')}>
            Dashboard
          </button>
          <button type="button" onClick={() => setFocusMode((value) => !value)}>
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <button type="button" onClick={addQuickTask}>
            Quick Drop
          </button>
          <button type="button" onClick={clearCompleted}>
            Clear Done
          </button>
        </div>
      </nav>

      <section className="hero-panel">
        <div className="hero-copy">
          <h1>Turn a plain checklist into a small command center.</h1>
          <p className="hero-text">
            Your tasks save instantly, filters respond live, and the board stays
            in motion while you work.
          </p>
        </div>

        <div className="hero-stats">
          <article>
            <span>{tasks.length}</span>
            <p>Total missions</p>
          </article>
          <article>
            <span>{activeCount}</span>
            <p>Still in motion</p>
          </article>
          <article>
            <span>{progress}%</span>
            <p>Completion pulse</p>
          </article>
          <article>
            <span>{todayDoneCount}</span>
            <p>Wins created today</p>
          </article>
        </div>
      </section>

      <section className="workspace">
        <div className="composer-card">
          <div className="card-heading">
            <h2>Create a mission</h2>
            <p>Drop in a task, give it a lane, and keep moving.</p>
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <label>
              Task title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Design the next big idea"
              />
            </label>

            <label>
              Notes
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                rows="3"
                placeholder="Add a useful reminder, context, or outcome."
              />
            </label>

            <label>
              Lane
              <select value={lane} onChange={(event) => setLane(event.target.value)}>
                {lanes
                  .filter((item) => item !== 'All')
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </label>

            <button type="submit">Add mission</button>
          </form>
        </div>

        <div className="board-card">
          <div className="board-topbar">
            <div>
              <h2>Mission board</h2>
              <p>{visibleTasks.length} tasks in the current view.</p>
            </div>

            <div className="board-controls">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks live..."
                aria-label="Search tasks"
              />

              <div
                className="filters lane-filters"
                role="tablist"
                aria-label="Filter tasks by lane"
              >
                {lanes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={filter === item ? 'active' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div
                className="filters status-filters"
                role="tablist"
                aria-label="Filter tasks by status"
              >
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
            </div>
          </div>

          <div className="task-list">
            {visibleTasks.length ? (
              visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-card ${task.done ? 'done' : ''}`}
                >
                  <div className="task-main">
                    <button
                      type="button"
                      className="toggle"
                      aria-label={`Mark ${task.title} as ${
                        task.done ? 'incomplete' : 'complete'
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.done ? 'Done' : 'Open'}
                    </button>

                    <div>
                      <div className="task-meta">
                        <span className="lane-badge">{task.lane}</span>
                        <span>{task.done ? 'Completed' : 'In progress'}</span>
                        <span>{formatDateLabel(task.createdAt)}</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => deleteTask(task.id)}
                  >
                    Remove
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <p>No missions match this view right now.</p>
                <span>Try another filter, clear the search, or add a fresh task.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

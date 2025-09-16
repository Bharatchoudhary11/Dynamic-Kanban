import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'dynamic-kanban.tasks'

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const getStoredTasks = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    const validStatuses = new Set(COLUMNS.map((column) => column.key))

    return parsed
      .filter((task) => validStatuses.has(task?.status) && typeof task?.id === 'string' && typeof task?.title === 'string')
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: typeof task.description === 'string' ? task.description : '',
        status: task.status,
      }))
  } catch (error) {
    console.warn('Unable to read tasks from localStorage:', error)
    return []
  }
}

function App() {
  const [tasks, setTasks] = useState(getStoredTasks)
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [activeColumn, setActiveColumn] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }
  }, [tasks])

  const tasksByStatus = useMemo(() => {
    const grouped = Object.fromEntries(COLUMNS.map((column) => [column.key, []]))

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    }

    return grouped
  }, [tasks])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const title = formData.title.trim()
    const description = formData.description.trim()

    if (!title) {
      return
    }

    const newTask = {
      id: createTaskId(),
      title,
      description,
      status: 'todo',
    }

    setTasks((current) => [newTask, ...current])

    setFormData({ title: '', description: '' })
  }

  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/plain', taskId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (event, status) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setActiveColumn((current) => (current === status ? current : status))
  }

  const handleDrop = (event, status) => {
    event.preventDefault()

    const taskId = event.dataTransfer.getData('text/plain')

    if (!taskId) {
      return
    }

    setTasks((current) => {
      let hasTask = false
      let hasStatusChanged = false

      const nextTasks = current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        hasTask = true

        if (task.status === status) {
          return task
        }

        hasStatusChanged = true
        return {
          ...task,
          status,
        }
      })

      if (!hasTask || !hasStatusChanged) {
        return current
      }

      return nextTasks
    })

    setActiveColumn(null)
    setDraggedTaskId(null)
    event.dataTransfer.clearData()
  }

  const handleDragLeave = (status) => {
    setActiveColumn((current) => (current === status ? null : current))
  }

  const handleDragEnd = () => {
    setDraggedTaskId(null)
    setActiveColumn(null)
  }

  const isSubmitDisabled = !formData.title.trim()

  return (
    <div className="app">
      <header className="page-header">
        <h1 className="page-title">Dynamic Kanban Board</h1>
        <p className="page-subtitle">
          Capture tasks and move them across workflow stages. Drag and drop cards to update their status instantly.
        </p>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Prepare sprint review"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Add details, resources, or acceptance criteria..."
            rows={3}
          />
        </div>

        <button type="submit" disabled={isSubmitDisabled}>
          Add Task
        </button>
      </form>

      <div className="board" role="application" aria-label="Kanban board">
        {COLUMNS.map((column) => {
          const columnTasks = tasksByStatus[column.key] ?? []
          const columnTitleId = `${column.key}-title`

          const columnClassNames = ['column']

          if (activeColumn === column.key) {
            columnClassNames.push('column--active')
          }

          if (draggedTaskId) {
            columnClassNames.push('column--droppable')
          }

          return (
            <section
              key={column.key}
              className={columnClassNames.join(' ')}
              aria-labelledby={columnTitleId}
              onDragOver={(event) => handleDragOver(event, column.key)}
              onDrop={(event) => handleDrop(event, column.key)}
              onDragLeave={() => handleDragLeave(column.key)}
            >
              <header className="column-header">
                <h2 id={columnTitleId}>{column.label}</h2>
                <span className="badge" aria-label={`${columnTasks.length} tasks`}>
                  {columnTasks.length}
                </span>
              </header>

              <div className="column-body" role="list">
                {columnTasks.length === 0 ? (
                  <p className="empty-state">No tasks here yet. Drop a card to get started.</p>
                ) : (
                  columnTasks.map((task) => (
                    <article
                      key={task.id}
                      className={`task-card${draggedTaskId === task.id ? ' task-card--dragging' : ''}`}
                      draggable
                      onDragStart={(event) => handleDragStart(event, task.id)}
                      onDragEnd={handleDragEnd}
                      role="listitem"
                      aria-grabbed={draggedTaskId === task.id}
                    >
                      <h3 className="task-title">{task.title}</h3>
                      {task.description ? <p className="task-description">{task.description}</p> : null}
                    </article>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default App

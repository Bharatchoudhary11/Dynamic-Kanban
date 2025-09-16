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
        isPriority: Boolean(task.isPriority),
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showPriorityOnly, setShowPriorityOnly] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingData, setEditingData] = useState({ title: '', description: '' })

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

  const filteredTasksByStatus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const isFilteringByPriority = showPriorityOnly

    if (!query && !isFilteringByPriority) {
      return tasksByStatus
    }

    return Object.fromEntries(
      COLUMNS.map((column) => {
        const columnTasks = tasksByStatus[column.key] ?? []

        const filteredTasks = columnTasks.filter((task) => {
          if (isFilteringByPriority && !task.isPriority) {
            return false
          }

          if (!query) {
            return true
          }

          const normalizedTitle = task.title.toLowerCase()
          const normalizedDescription = task.description.toLowerCase()

          return normalizedTitle.includes(query) || normalizedDescription.includes(query)
        })

        return [column.key, filteredTasks]
      }),
    )
  }, [searchQuery, showPriorityOnly, tasksByStatus])

  const hasActiveFilters = Boolean(searchQuery.trim()) || showPriorityOnly

  const visibleTaskCount = useMemo(
    () => COLUMNS.reduce((total, column) => total + (filteredTasksByStatus[column.key]?.length ?? 0), 0),
    [filteredTasksByStatus],
  )

  const totalTasksByStatus = useMemo(
    () => Object.fromEntries(COLUMNS.map((column) => [column.key, tasksByStatus[column.key]?.length ?? 0])),
    [tasksByStatus],
  )

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
      isPriority: false,
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

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  const togglePriorityFilter = () => {
    setShowPriorityOnly((current) => !current)
  }

  const toggleTaskPriority = (taskId) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isPriority: !task.isPriority,
            }
          : task,
      ),
    )
  }

  const cancelEditingTask = () => {
    setEditingTaskId(null)
    setEditingData({ title: '', description: '' })
  }

  const handleDeleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))

    if (editingTaskId === taskId) {
      cancelEditingTask()
    }
  }

  const startEditingTask = (task) => {
    setEditingTaskId(task.id)
    setEditingData({ title: task.title, description: task.description })
  }

  const handleEditFieldChange = (event) => {
    const { name, value } = event.target

    setEditingData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleEditSubmit = (event) => {
    event.preventDefault()

    if (!editingTaskId) {
      return
    }

    const title = editingData.title.trim()
    const description = editingData.description.trim()

    if (!title) {
      return
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title,
              description,
            }
          : task,
      ),
    )

    setEditingTaskId(null)
    setEditingData({ title: '', description: '' })
  }

  const isSubmitDisabled = !formData.title.trim()
  const isEditingSubmitDisabled = !editingData.title.trim()

  return (
    <div className="app">
      <header className="page-header">
        <h1 className="page-title">Dynamic Kanban Board</h1>
        <p className="page-subtitle">
          Capture tasks and move them across workflow stages. Drag and drop cards to update their status instantly.
        </p>

        <div className="board-controls" role="region" aria-label="Board controls">
          <div className={`search-field${searchQuery ? ' search-field--active' : ''}`}>
            <label htmlFor="task-search">Search tasks</label>
            <input
              id="task-search"
              type="search"
              name="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by title or description"
              autoComplete="off"
            />
            {searchQuery ? (
              <button type="button" className="search-field__clear" onClick={handleClearSearch} aria-label="Clear search">
                ×
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={`filter-toggle${showPriorityOnly ? ' filter-toggle--active' : ''}`}
            onClick={togglePriorityFilter}
            aria-pressed={showPriorityOnly}
          >
            {showPriorityOnly ? 'Showing priority tasks' : 'Show priority tasks only'}
          </button>
        </div>

        {hasActiveFilters ? (
          <p className="filter-summary" role="status">
            Showing {visibleTaskCount} of {tasks.length} tasks
          </p>
        ) : null}
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
          const columnTasks = filteredTasksByStatus[column.key] ?? []
          const columnTitleId = `${column.key}-title`

          const columnClassNames = ['column']

          if (activeColumn === column.key) {
            columnClassNames.push('column--active')
          }

          if (draggedTaskId) {
            columnClassNames.push('column--droppable')
          }

          const totalTasksInColumn = totalTasksByStatus[column.key] ?? 0
          const badgeLabel = hasActiveFilters
            ? `${columnTasks.length} of ${totalTasksInColumn} tasks`
            : `${columnTasks.length} tasks`

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
                <span className="badge" aria-label={badgeLabel}>
                  {hasActiveFilters ? `${columnTasks.length}/${totalTasksInColumn}` : columnTasks.length}
                </span>
              </header>

              <div className="column-body" role="list">
                {columnTasks.length === 0 ? (
                  <p className="empty-state">
                    {hasActiveFilters && totalTasksInColumn > 0
                      ? 'No tasks match your filters.'
                      : 'No tasks here yet. Drop a card to get started.'}
                  </p>
                ) : (
                  columnTasks.map((task) => {
                    const isEditing = editingTaskId === task.id

                    const cardClassNames = ['task-card']

                    if (draggedTaskId === task.id) {
                      cardClassNames.push('task-card--dragging')
                    }

                    if (task.isPriority) {
                      cardClassNames.push('task-card--priority')
                    }

                    if (isEditing) {
                      cardClassNames.push('task-card--editing')
                    }

                    const dragProps = isEditing
                      ? {}
                      : {
                          draggable: true,
                          onDragStart: (event) => handleDragStart(event, task.id),
                          onDragEnd: handleDragEnd,
                          'aria-grabbed': draggedTaskId === task.id,
                        }

                    return (
                      <article key={task.id} className={cardClassNames.join(' ')} role="listitem" {...dragProps}>
                        <header className="task-card__header">
                          <div className="task-card__title">
                            {task.isPriority ? (
                              <span className="task-priority-indicator" aria-label="Priority task" title="Priority task">
                                ★
                              </span>
                            ) : null}
                            <h3 className="task-title">{task.title}</h3>
                          </div>
                          <button
                            type="button"
                            className={`task-action task-action--priority${task.isPriority ? ' is-active' : ''}`}
                            onClick={() => toggleTaskPriority(task.id)}
                            aria-pressed={task.isPriority}
                            aria-label={task.isPriority ? 'Remove priority flag' : 'Mark task as priority'}
                          >
                            ★
                          </button>
                        </header>

                        {isEditing ? (
                          <form className="task-edit-form" onSubmit={handleEditSubmit}>
                            <div className="task-edit-field">
                              <label className="sr-only" htmlFor={`edit-title-${task.id}`}>
                                Edit task title
                              </label>
                              <input
                                id={`edit-title-${task.id}`}
                                name="title"
                                type="text"
                                value={editingData.title}
                                onChange={handleEditFieldChange}
                                autoComplete="off"
                                placeholder="Update task title"
                                required
                              />
                            </div>

                            <div className="task-edit-field">
                              <label className="sr-only" htmlFor={`edit-description-${task.id}`}>
                                Edit task description
                              </label>
                              <textarea
                                id={`edit-description-${task.id}`}
                                name="description"
                                value={editingData.description}
                                onChange={handleEditFieldChange}
                                rows={3}
                                placeholder="Update task details"
                              />
                            </div>

                            <div className="task-card__actions">
                              <button type="button" onClick={cancelEditingTask} className="task-action">
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="task-action task-action--primary"
                                disabled={isEditingSubmitDisabled}
                              >
                                Save changes
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {task.description ? <p className="task-description">{task.description}</p> : null}
                            <div className="task-card__actions">
                              <button type="button" className="task-action" onClick={() => startEditingTask(task)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="task-action task-action--danger"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    )
                  })
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

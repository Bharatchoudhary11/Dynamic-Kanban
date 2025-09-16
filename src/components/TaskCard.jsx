import { useEffect, useState } from 'react'

function TaskCard({
  task,
  isDragging,
  onTogglePriority,
  onDeleteTask,
  onUpdateTask,
  onDragStart,
  onDragEnd,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingData, setEditingData] = useState({ title: task.title, description: task.description })

  useEffect(() => {
    if (!isEditing) {
      setEditingData({ title: task.title, description: task.description })
    }
  }, [task.title, task.description, isEditing])

  const startEditing = () => {
    setIsEditing(true)
    setEditingData({ title: task.title, description: task.description })
  }

  const cancelEditing = () => {
    setIsEditing(false)
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

    const trimmedTitle = editingData.title.trim()
    const trimmedDescription = editingData.description.trim()

    if (!trimmedTitle) {
      return
    }

    onUpdateTask(task.id, { title: trimmedTitle, description: trimmedDescription })
    setIsEditing(false)
  }

  const isEditingSubmitDisabled = !editingData.title.trim()

  const cardClassNames = ['task-card']

  if (isDragging) {
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
        onDragStart: (event) => onDragStart(event, task.id),
        onDragEnd,
        'aria-grabbed': isDragging,
      }

  return (
    <article className={cardClassNames.join(' ')} role="listitem" {...dragProps}>
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
          onClick={() => onTogglePriority(task.id)}
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
            <button type="button" onClick={cancelEditing} className="task-action">
              Cancel
            </button>
            <button type="submit" className="task-action task-action--primary" disabled={isEditingSubmitDisabled}>
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <>
          {task.description ? <p className="task-description">{task.description}</p> : null}
          <div className="task-card__actions">
            <button type="button" className="task-action" onClick={startEditing}>
              Edit
            </button>
            <button type="button" className="task-action task-action--danger" onClick={() => onDeleteTask(task.id)}>
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  )
}

export default TaskCard

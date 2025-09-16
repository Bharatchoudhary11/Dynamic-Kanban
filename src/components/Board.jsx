import TaskCard from './TaskCard'

function Board({
  columns,
  tasksByStatus,
  totalTasksByStatus,
  hasActiveFilters,
  activeColumn,
  draggedTaskId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  onToggleTaskPriority,
  onUpdateTask,
  onDeleteTask,
}) {
  return (
    <div className="board" role="application" aria-label="Kanban board">
      {columns.map((column) => {
        const columnTasks = tasksByStatus[column.key] ?? []
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
            onDragOver={(event) => onDragOver(event, column.key)}
            onDrop={(event) => onDrop(event, column.key)}
            onDragLeave={() => onDragLeave(column.key)}
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
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={draggedTaskId === task.id}
                    onTogglePriority={onToggleTaskPriority}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Board

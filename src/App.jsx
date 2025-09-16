import { useCallback, useMemo, useState } from 'react'
import './App.css'
import Board from './components/Board'
import BoardHeader from './components/BoardHeader'
import TaskForm from './components/TaskForm'
import { COLUMNS } from './constants/board'
import useTasks from './hooks/useTasks'

function App() {
  const { tasks, tasksByStatus, totalTasksByStatus, addTask, moveTask, togglePriority, updateTask, deleteTask } = useTasks()
  const [searchQuery, setSearchQuery] = useState('')
  const [showPriorityOnly, setShowPriorityOnly] = useState(false)
  const [activeColumn, setActiveColumn] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  const filteredTasksByStatus = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filterByPriority = showPriorityOnly

    if (!query && !filterByPriority) {
      return tasksByStatus
    }

    return Object.fromEntries(
      COLUMNS.map((column) => {
        const columnTasks = tasksByStatus[column.key] ?? []

        const filteredTasks = columnTasks.filter((task) => {
          if (filterByPriority && !task.isPriority) {
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

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleTogglePriorityFilter = useCallback(() => {
    setShowPriorityOnly((current) => !current)
  }, [])

  const handleCreateTask = useCallback(
    ({ title, description }) => {
      if (!title) {
        return
      }

      addTask({ title, description })
    },
    [addTask],
  )

  const handleUpdateTask = useCallback(
    (taskId, updates) => {
      if (!updates.title) {
        return
      }

      updateTask(taskId, updates)
    },
    [updateTask],
  )

  const handleDeleteTask = useCallback((taskId) => {
    deleteTask(taskId)
  }, [deleteTask])

  const handleToggleTaskPriority = useCallback((taskId) => {
    togglePriority(taskId)
  }, [togglePriority])

  const handleDragStart = useCallback((event, taskId) => {
    event.dataTransfer.setData('text/plain', taskId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(taskId)
  }, [])

  const handleDragOver = useCallback((event, status) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setActiveColumn((current) => (current === status ? current : status))
  }, [])

  const handleDrop = useCallback(
    (event, status) => {
      event.preventDefault()

      const taskId = event.dataTransfer.getData('text/plain')

      if (!taskId) {
        return
      }

      moveTask(taskId, status)
      setActiveColumn(null)
      setDraggedTaskId(null)
      event.dataTransfer.clearData()
    },
    [moveTask],
  )

  const handleDragLeave = useCallback((status) => {
    setActiveColumn((current) => (current === status ? null : current))
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null)
    setActiveColumn(null)
  }, [])

  return (
    <div className="app">
      <BoardHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        showPriorityOnly={showPriorityOnly}
        onTogglePriorityFilter={handleTogglePriorityFilter}
        hasActiveFilters={hasActiveFilters}
        visibleTaskCount={visibleTaskCount}
        totalTaskCount={tasks.length}
      />

      <TaskForm onCreateTask={handleCreateTask} />

      <Board
        columns={COLUMNS}
        tasksByStatus={filteredTasksByStatus}
        totalTasksByStatus={totalTasksByStatus}
        hasActiveFilters={hasActiveFilters}
        activeColumn={activeColumn}
        draggedTaskId={draggedTaskId}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={handleDragLeave}
        onToggleTaskPriority={handleToggleTaskPriority}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  )
}

export default App

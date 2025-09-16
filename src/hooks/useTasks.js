import { useCallback, useEffect, useMemo, useState } from 'react'
import { COLUMNS, STORAGE_KEY } from '../constants/board'

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const parseStoredTasks = (rawValue) => {
  if (!Array.isArray(rawValue)) {
    return []
  }

  const validStatuses = new Set(COLUMNS.map((column) => column.key))

  return rawValue
    .filter((task) => validStatuses.has(task?.status) && typeof task?.id === 'string' && typeof task?.title === 'string')
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: typeof task.description === 'string' ? task.description : '',
      status: task.status,
      isPriority: Boolean(task.isPriority),
    }))
}

const readTasksFromStorage = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsed = JSON.parse(storedValue)
    return parseStoredTasks(parsed)
  } catch (error) {
    console.warn('Unable to read tasks from localStorage:', error)
    return []
  }
}

function useTasks() {
  const [tasks, setTasks] = useState(readTasksFromStorage)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.warn('Unable to save tasks to localStorage:', error)
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

  const totalTasksByStatus = useMemo(
    () => Object.fromEntries(COLUMNS.map((column) => [column.key, tasksByStatus[column.key]?.length ?? 0])),
    [tasksByStatus],
  )

  const addTask = useCallback(({ title, description }) => {
    setTasks((current) => [
      {
        id: createTaskId(),
        title,
        description,
        status: 'todo',
        isPriority: false,
      },
      ...current,
    ])
  }, [])

  const moveTask = useCallback((taskId, nextStatus) => {
    setTasks((current) => {
      let hasTask = false
      let hasStatusChanged = false

      const nextTasks = current.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        hasTask = true

        if (task.status === nextStatus) {
          return task
        }

        hasStatusChanged = true
        return {
          ...task,
          status: nextStatus,
        }
      })

      if (!hasTask || !hasStatusChanged) {
        return current
      }

      return nextTasks
    })
  }, [])

  const togglePriority = useCallback((taskId) => {
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
  }, [])

  const updateTask = useCallback((taskId, updates) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    )
  }, [])

  const deleteTask = useCallback((taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }, [])

  return {
    tasks,
    tasksByStatus,
    totalTasksByStatus,
    addTask,
    moveTask,
    togglePriority,
    updateTask,
    deleteTask,
  }
}

export default useTasks

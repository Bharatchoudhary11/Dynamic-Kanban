import { useState } from 'react'

const INITIAL_FORM_STATE = { title: '', description: '' }

function TaskForm({ onCreateTask }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedTitle = formData.title.trim()
    const trimmedDescription = formData.description.trim()

    if (!trimmedTitle) {
      return
    }

    onCreateTask({ title: trimmedTitle, description: trimmedDescription })
    setFormData(INITIAL_FORM_STATE)
  }

  const isSubmitDisabled = !formData.title.trim()

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="task-title">Task title</label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
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
          onChange={handleChange}
          placeholder="Add details, resources, or acceptance criteria..."
          rows={3}
        />
      </div>

      <button type="submit" disabled={isSubmitDisabled}>
        Add Task
      </button>
    </form>
  )
}

export default TaskForm

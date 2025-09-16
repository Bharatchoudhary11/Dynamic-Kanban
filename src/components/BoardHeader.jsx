function BoardHeader({
  searchQuery,
  onSearchChange,
  onClearSearch,
  showPriorityOnly,
  onTogglePriorityFilter,
  hasActiveFilters,
  visibleTaskCount,
  totalTaskCount,
}) {
  return (
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
            onChange={onSearchChange}
            placeholder="Search by title or description"
            autoComplete="off"
          />
          {searchQuery ? (
            <button type="button" className="search-field__clear" onClick={onClearSearch} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className={`filter-toggle${showPriorityOnly ? ' filter-toggle--active' : ''}`}
          onClick={onTogglePriorityFilter}
          aria-pressed={showPriorityOnly}
        >
          {showPriorityOnly ? 'Showing priority tasks' : 'Show priority tasks only'}
        </button>
      </div>

      {hasActiveFilters ? (
        <p className="filter-summary" role="status">
          Showing {visibleTaskCount} of {totalTaskCount} tasks
        </p>
      ) : null}
    </header>
  )
}

export default BoardHeader

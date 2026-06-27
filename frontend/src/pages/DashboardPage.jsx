import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTasks } from '../contexts/TaskContext';
import TaskForm from '../components/tasks/TaskForm';
import TaskItem from '../components/tasks/TaskItem';
import FilterTabs from '../components/tasks/FilterTabs';

const FILTERS = { ALL: 'all', PENDING: 'pending', COMPLETED: 'completed', SEARCH: 'search' };

export default function DashboardPage() {
  const {
    visibleTasks,
    stats,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    error,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
  } = useTasks();

  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (payload) => {
    try {
      await createTask(payload);
      setShowForm(false);
      toast.success('Task created');
    } catch (err) {
      toast.error(err.message || 'Could not create task');
      throw err;
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await updateTask(id, payload);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.message || 'Could not update task');
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.message || 'Could not delete task');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleComplete(id);
    } catch (err) {
      toast.error(err.message || 'Could not toggle task');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim().length >= 2) {
      setFilter(FILTERS.SEARCH);
    } else if (filter === FILTERS.SEARCH && value.trim().length === 0) {
      setFilter(FILTERS.ALL);
    }
  };

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-32 right-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

      <section className="relative mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} gradient="from-indigo-500 to-purple-500" icon="📋" />
        <StatCard label="Pending" value={stats.pending} gradient="from-amber-400 to-orange-500" icon="⏳" />
        <StatCard label="Completed" value={stats.completed} gradient="from-emerald-400 to-teal-500" icon="✅" />
      </section>

      <div className="relative mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs value={filter} onChange={setFilter} />
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 sm:w-64"
          />
        </div>
      </div>

      {showForm ? (
        <div className="mb-4 animate-slide-up">
          <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="group mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-fuchsia-300 bg-gradient-to-r from-fuchsia-50 via-amber-50 to-cyan-50 py-4 text-sm font-semibold text-fuchsia-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-fuchsia-500 hover:from-fuchsia-100 hover:via-amber-100 hover:to-cyan-100 hover:shadow-md"
        >
          <span className="text-lg transition-transform group-hover:rotate-90">＋</span>
          Add a new task
          <span className="text-lg transition-transform group-hover:scale-125">✨</span>
        </button>
      )}

      {loading && (
        <p className="mb-2 text-center text-sm text-slate-500">
          <span className="inline-block animate-pulse">⏳</span> Loading tasks...
        </p>
      )}

      {error && !loading && (
        <p
          role="alert"
          className="mb-2 rounded-md border border-red-200 bg-red-50 p-2 text-center text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!loading && !error && visibleTasks && visibleTasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <div className="mb-2 text-4xl">📝</div>
          <p className="text-sm text-slate-500">
            {filter === FILTERS.SEARCH
              ? 'No tasks match your search.'
              : 'No tasks yet. Click "Add a new task" to get started.'}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {visibleTasks && visibleTasks
          .filter((task) => task && task.id)
          .map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
      </ul>
    </main>
  );
}

function StatCard({ label, value, gradient = 'from-slate-500 to-slate-700', icon = '📊' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/80 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className="text-xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{icon}</span>
      </div>
      <p className={`mt-2 bg-gradient-to-br ${gradient} bg-clip-text text-3xl font-extrabold text-transparent`}>
        {value}
      </p>
    </div>
  );
}

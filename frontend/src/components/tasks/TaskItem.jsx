import { useEffect, useState } from 'react';
import { TASK_PRIORITY } from '../../constants';
import { formatDate } from '../../utils';

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
};

export default function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);

  // FIX BUG-M04: only reset local edit state when the task identity changes
  // (or when we exit edit mode). Editing-in-progress is preserved across
  // background re-renders that re-create the task object with the same id.
  useEffect(() => {
    if (!editing) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, editing]);

  const handleSave = async () => {
    if (!title.trim()) return;
    await onUpdate(task.id, { title: title.trim(), description, priority });
    setEditing(false);
  };

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => onToggle(task.id)}
          className="mt-1 h-4 w-4 cursor-pointer accent-brand-600"
          aria-label={`Mark ${task.title} as ${task.status === 'completed' ? 'pending' : 'completed'}`}
        />
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                aria-label="Edit title"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                aria-label="Edit description"
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Edit priority"
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {Object.values(TASK_PRIORITY).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  className="rounded-md bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                aria-label={`Task title: ${task.title}`}
                className={
                  task.status === 'completed'
                    ? 'text-sm font-medium text-slate-400 line-through'
                    : 'text-sm font-medium text-slate-800'
                }
              >
                {task.title}
              </p>
              {task.description && (
                <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLES[task.priority] || ''}`}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-slate-500">Due {formatDate(task.dueDate)}</span>
                )}
                {task.completedAt && (
                  <span className="text-emerald-600">
                    ✓ Completed {formatDate(task.completedAt)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit ${task.title}`}
              className="text-xs text-slate-500 hover:text-brand-600"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              aria-label={`Delete ${task.title}`}
              className="text-xs text-slate-500 hover:text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
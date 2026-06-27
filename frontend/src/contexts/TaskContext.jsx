import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAbortableEffect, useDebouncedValue } from '../hooks/useAbortable';
import { taskService } from '../services';

const TaskContext = createContext(null);

/**
 * Derive stats from the in-memory task list (BUG-H06).
 * O(n) but only when `tasks` changes.
 */
function deriveStats(tasks) {
  if (!Array.isArray(tasks)) {
    return { total: 0, pending: 0, completed: 0 };
  }
  let pending = 0;
  let completed = 0;
  for (const t of tasks) {
    if (!t || typeof t !== 'object') continue;
    if (t.status === 'completed') completed += 1;
    else pending += 1;
  }
  return { total: pending + completed, pending, completed };
}

/**
 * Normalize a task returned from the API, defending against malformed payloads.
 */
function normalizeTask(t) {
  if (!t || typeof t !== 'object' || !t.id) return null;
  return t;
}

export function TaskProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { run, abort } = useAbortableEffect();

  // FIX BUG-M11: monotonic token ensures only the latest fetch commits state.
  const fetchTokenRef = useRef(0);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // FIX BUG-H06: stats via useMemo — no separate effect / setState cycle.
  const stats = useMemo(() => deriveStats(tasks), [tasks]);

  const fetchTasks = useCallback(
    async (override) => {
      if (!isAuthenticated) return;
      const myToken = ++fetchTokenRef.current;
      setLoading(true);
      setError(null);
      try {
        const f = override?.filter ?? filter;
        const q = override?.search ?? debouncedSearch;
        const params = { filter: f };
        if (f === 'search' && q.trim()) params.q = q.trim();

        const res = await run((signal) => taskService.list(params, { signal }));

        // FIX BUG-H01: only commit if this is still the latest request.
        if (myToken !== fetchTokenRef.current) return;

        const items = res?.data?.data?.items || res?.data?.items || [];
        const validItems = Array.isArray(items)
          ? items.map(normalizeTask).filter(Boolean)
          : [];
        setTasks(validItems);
      } catch (err) {
        // Don't surface cancellation as an error.
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        if (myToken !== fetchTokenRef.current) return;
        setError(err.message || 'Failed to load tasks');
      } finally {
        if (myToken === fetchTokenRef.current) {
          setLoading(false);
        }
      }
    },
    [isAuthenticated, filter, debouncedSearch, run]
  );

  // Auto-refetch when inputs change.
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    } else {
      // Reset when logged out so a re-login doesn't see stale data.
      setTasks([]);
      setError(null);
    }
    return () => abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filter, debouncedSearch]);

  // FIX BUG-C04: optimistic state mutation with rollback on failure.
  const createTask = useCallback(async (payload) => {
    const res = await taskService.create(payload);
    const newTask = normalizeTask(res?.data?.data?.task || res?.data?.task || res?.data);
    if (!newTask) {
      throw new Error('Invalid response from server');
    }
    setTasks((prev) => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [newTask, ...prevArray];
    });
    return newTask;
  }, []);

  const updateTask = useCallback(async (id, payload) => {
    // Snapshot for rollback.
    const prev = tasksRef.current;
    const optimistic = prev.find((t) => t && t.id === id);
    if (optimistic) {
      // Apply optimistic update immediately.
      setTasks((p) =>
        (Array.isArray(p) ? p : []).map((t) => (t && t.id === id ? { ...t, ...payload } : t))
      );
    }
    try {
      const res = await taskService.update(id, payload);
      const updatedTask = normalizeTask(res?.data?.data?.task || res?.data?.task || res?.data);
      if (!updatedTask) throw new Error('Invalid response from server');
      setTasks((p) =>
        (Array.isArray(p) ? p : []).map((t) => (t && t.id === id ? updatedTask : t))
      );
      return updatedTask;
    } catch (err) {
      // Rollback to snapshot.
      setTasks(prev);
      throw err;
    }
  }, []);

  const toggleComplete = useCallback(async (id) => {
    const prev = tasksRef.current;
    setTasks((p) =>
      (Array.isArray(p) ? p : []).map((t) =>
        t && t.id === id
          ? {
              ...t,
              status: t.status === 'completed' ? 'pending' : 'completed',
              completedAt: t.status === 'completed' ? null : new Date().toISOString(),
            }
          : t
      )
    );
    try {
      const res = await taskService.toggle(id);
      const updatedTask = normalizeTask(res?.data?.data?.task || res?.data?.task || res?.data);
      if (!updatedTask) throw new Error('Invalid response from server');
      setTasks((p) =>
        (Array.isArray(p) ? p : []).map((t) => (t && t.id === id ? updatedTask : t))
      );
      return updatedTask;
    } catch (err) {
      setTasks(prev);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    const prev = tasksRef.current;
    setTasks((p) => (Array.isArray(p) ? p : []).filter((t) => t && t.id !== id));
    try {
      await taskService.remove(id);
    } catch (err) {
      setTasks(prev);
      throw err;
    }
  }, []);

  // FIX BUG-C03: visibleTasks depends only on tasks/filter/search.
  // No "search" filter sent to server when the query is empty (handled in fetchTasks).
  const visibleTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    const validTasks = tasks.filter((t) => t && typeof t === 'object' && t.id);
    if (filter !== 'search') return validTasks;
    const q = search.trim().toLowerCase();
    if (!q) return validTasks;
    return validTasks.filter(
      (t) => t.title?.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    );
  }, [tasks, filter, search]);

  // FIX BUG-C03: include ALL consumer values in the memo dep array; do not mutate.
  const value = useMemo(
    () => ({
      tasks,
      visibleTasks,
      stats,
      filter,
      setFilter,
      search,
      setSearch,
      loading,
      error,
      fetchTasks,
      createTask,
      updateTask,
      toggleComplete,
      deleteTask,
    }),
    [
      tasks,
      visibleTasks,
      stats,
      filter,
      search,
      loading,
      error,
      fetchTasks,
      createTask,
      updateTask,
      toggleComplete,
      deleteTask,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used inside <TaskProvider>');
  return ctx;
}
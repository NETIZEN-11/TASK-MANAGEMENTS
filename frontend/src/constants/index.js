export const TASK_STATUS = Object.freeze({ PENDING: 'pending', COMPLETED: 'completed' });
export const TASK_PRIORITY = Object.freeze({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });
export const TASK_FILTERS = Object.freeze([
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
]);

export const STORAGE_KEYS = Object.freeze({ AUTH: 'tm.auth' });
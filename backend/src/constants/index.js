module.exports = {
  ROLES: Object.freeze({ USER: 'user', ADMIN: 'admin' }),
  TASK_STATUS: Object.freeze({
    PENDING: 'pending',
    COMPLETED: 'completed',
  }),
  TASK_FILTER: Object.freeze({
    ALL: 'all',
    PENDING: 'pending',
    COMPLETED: 'completed',
  }),
  TASK_PRIORITY: Object.freeze({
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  }),
  PAGINATION: Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  }),
};
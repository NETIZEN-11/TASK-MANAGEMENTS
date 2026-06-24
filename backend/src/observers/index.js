const emitter = require('./taskEventEmitter');
const logger = require('../utils/logger');

const TASK_EVENTS = Object.freeze({
  CREATED: 'task.created',
  UPDATED: 'task.updated',
  COMPLETED: 'task.completed',
  DELETED: 'task.deleted',
});

let registered = false;

// FIX BUG-L03: Make observer registration explicit instead of at module load
function registerDefaultObservers() {
  if (registered) return;
  registered = true;
  
  emitter.on(TASK_EVENTS.CREATED, (payload) => {
    logger.info(`[observer] task created: ${payload.taskId} by user ${payload.userId}`);
  });
  emitter.on(TASK_EVENTS.COMPLETED, (payload) => {
    logger.info(`[observer] task completed: ${payload.taskId} by user ${payload.userId}`);
  });
  emitter.on(TASK_EVENTS.DELETED, (payload) => {
    logger.info(`[observer] task deleted: ${payload.taskId} by user ${payload.userId}`);
  });
  emitter.on(TASK_EVENTS.UPDATED, (payload) => {
    logger.info(`[observer] task updated: ${payload.taskId} by user ${payload.userId}`);
  });
  
  logger.info('[observers] Default task observers registered');
}

function resetObservers() {
  emitter.reset();
  registered = false;
}

// Auto-register observers (keep for backward compatibility but make it explicit)
// In production, this should be called from server.js startup
registerDefaultObservers();

module.exports = { emitter, TASK_EVENTS, registerDefaultObservers, resetObservers };
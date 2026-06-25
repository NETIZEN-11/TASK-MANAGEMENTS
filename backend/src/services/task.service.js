const taskRepository = require('../repositories/task.repository');
const { TaskFilterStrategyFactory } = require('../strategies/taskFilter.strategy');
const { emitter, TASK_EVENTS } = require('../observers');
const DtoFactory = require('../factories/dto.factory');
const ApiError = require('../utils/ApiError');
const { PAGINATION, TASK_STATUS } = require('../constants');
const logger = require('../utils/logger');

class TaskService {
  constructor({ taskRepo = taskRepository } = {}) {
    this.taskRepo = taskRepo;
  }

  async createTask(userId, payload) {
    const task = await this.taskRepo.create({ ...payload, owner: userId });
    try {
      emitter.emit(TASK_EVENTS.CREATED, { taskId: task._id.toString(), userId });
    } catch (e) {
      logger.error(`[observer] emit failed: ${e.message}`);
    }
    return DtoFactory.createTaskDto(task);
  }

  async listTasks(userId, { filter = 'all', q, page, limit }) {
    const strategy = TaskFilterStrategyFactory.get(filter);
    const filterObj = strategy.build({ ownerId: userId, q });

    const safePage = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(page, 10) || PAGINATION.DEFAULT_PAGE);
    const safeLimit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (safePage - 1) * safeLimit;

    const sort = filter === 'search' ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
    const projection = filter === 'search' ? { score: { $meta: 'textScore' } } : {};

    const { items, total } = await this.taskRepo.findPageByOwner(userId, {
      filter: filterObj,
      skip,
      limit: safeLimit,
      sort,
      projection,
    });

    return {
      items: DtoFactory.createTaskList(items),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getTask(userId, taskId) {
    const task = await this.taskRepo.findByIdAndOwner(taskId, userId);
    if (!task) throw ApiError.notFound('Task not found');
    return DtoFactory.createTaskDto(task);
  }

  async updateTask(userId, taskId, update) {
    if (Object.prototype.hasOwnProperty.call(update, 'status')) {
      update.completedAt = update.status === TASK_STATUS.COMPLETED ? new Date() : null;
    }
    const task = await this.taskRepo.updateByIdAndOwner(taskId, userId, update);
    if (!task) throw ApiError.notFound('Task not found');
    this.#emit(TASK_EVENTS.UPDATED, { taskId, userId });
    if (task.status === TASK_STATUS.COMPLETED) {
      this.#emit(TASK_EVENTS.COMPLETED, { taskId, userId });
    }
    return DtoFactory.createTaskDto(task);
  }

  async toggleComplete(userId, taskId) {
    const updated = await this.taskRepo.toggleStatusAtomically(taskId, userId);
    if (!updated) throw ApiError.notFound('Task not found');
    this.#emit(TASK_EVENTS.UPDATED, { taskId, userId });
    if (updated.status === TASK_STATUS.COMPLETED) {
      this.#emit(TASK_EVENTS.COMPLETED, { taskId, userId });
    }
    return DtoFactory.createTaskDto(updated);
  }

  async deleteTask(userId, taskId) {
    const deleted = await this.taskRepo.deleteByIdAndOwner(taskId, userId);
    if (!deleted) throw ApiError.notFound('Task not found');
    this.#emit(TASK_EVENTS.DELETED, { taskId, userId });
    return { id: taskId };
  }

  async getStats(userId) {
    // FIX BUG-H01: Use aggregation instead of 3 separate queries
    const result = await this.taskRepo.getStatsByAggregation(userId);
    return result;
  }

  #emit(event, payload) {
    try {
      emitter.emit(event, payload);
    } catch (e) {
      logger.error(`[observer] emit ${event} failed: ${e.message}`);
    }
  }
}

module.exports = new TaskService();
module.exports.TaskService = TaskService;
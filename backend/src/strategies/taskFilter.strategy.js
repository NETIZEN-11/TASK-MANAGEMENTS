const { TASK_STATUS, TASK_FILTER } = require('../constants');
const ApiError = require('../utils/ApiError');

class TaskFilterStrategy {
  build({ ownerId, q }) {
    throw new Error('build() must be implemented');
  }
}

class AllTasksStrategy extends TaskFilterStrategy {
  build({ ownerId }) {
    return { owner: ownerId };
  }
}

class PendingTasksStrategy extends TaskFilterStrategy {
  build({ ownerId }) {
    return { owner: ownerId, status: TASK_STATUS.PENDING };
  }
}

class CompletedTasksStrategy extends TaskFilterStrategy {
  build({ ownerId }) {
    return { owner: ownerId, status: TASK_STATUS.COMPLETED };
  }
}

class SearchTasksStrategy extends TaskFilterStrategy {
  build({ ownerId, q }) {
    if (!q) {
      throw ApiError.badRequest('Search query "q" is required for search strategy');
    }
    return { owner: ownerId, $text: { $search: q.trim() } };
  }
}

class TaskFilterStrategyFactory {
  static strategies = {
    [TASK_FILTER.ALL]: new AllTasksStrategy(),
    [TASK_FILTER.PENDING]: new PendingTasksStrategy(),
    [TASK_FILTER.COMPLETED]: new CompletedTasksStrategy(),
    search: new SearchTasksStrategy(),
  };

  static get(key) {
    const strategy = this.strategies[key];
    if (!strategy) {
      throw ApiError.badRequest(`Unsupported filter strategy: ${key}`);
    }
    return strategy;
  }
}

module.exports = { TaskFilterStrategyFactory };
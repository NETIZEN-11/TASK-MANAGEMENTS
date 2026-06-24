const mongoose = require('mongoose');
const Task = require('../models/task.model');

/**
 * Owner-scoped index hint for the common (filter !== 'search') list path.
 * Dramatically improves query plan stability at scale (BUG-M02).
 */
const LIST_INDEX_HINT = 'owner_1_status_1_createdAt_-1';

class TaskRepository {
  create(data) {
    return Task.create(data);
  }

  findById(id) {
    return Task.findById(id).lean().maxTimeMS(2000);
  }

  findByIdAndOwner(id, ownerId) {
    return Task.findOne({ _id: id, owner: ownerId }).lean().maxTimeMS(2000);
  }

  /**
   * Paginated owner-scoped query with bound execution time.
   *
   * - Uses an aggregation $facet to fetch items + total in a single round-trip
   *   instead of two parallel queries (BUG-C05).
   * - Sanitizes the filter to a known allow-list (status, $text) to prevent
   *   NoSQL injection from arbitrary callers.
   * - Caps server-side execution time at 2 s; slow queries fail fast.
   */
  async findPageByOwner(ownerId, { filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 }, projection = {} } = {}) {
    const allowedFilterKeys = ['status', '$text'];
    const sanitizedFilter = {};

    for (const key of Object.keys(filter)) {
      if (allowedFilterKeys.includes(key)) {
        if (key === '$text' && filter[key].$search) {
          sanitizedFilter[key] = { $search: String(filter[key].$search) };
        } else {
          sanitizedFilter[key] = filter[key];
        }
      }
    }

    const allowedSortKeys = ['createdAt', 'score', 'title', 'status', 'priority', 'dueDate'];
    const sanitizedSort = {};
    for (const key of Object.keys(sort)) {
      if (allowedSortKeys.includes(key)) {
        sanitizedSort[key] = sort[key];
      }
    }

    const projectionObj = Object.keys(projection).length
      ? { ...projection, __v: 0 }
      : { __v: 0 };

    const ownerOid = mongoose.Types.ObjectId.isValid(ownerId)
      ? new mongoose.Types.ObjectId(String(ownerId))
      : ownerId;

    const matchStage = { owner: ownerOid, ...sanitizedFilter };
    const sortStage = Object.keys(sanitizedSort).length ? sanitizedSort : { createdAt: -1 };

    // $facet does items + total in one aggregation; maxTimeMS bounds execution.
    const aggResult = await Task.aggregate([
      { $match: matchStage },
      {
        $facet: {
          items: [
            { $sort: sortStage },
            { $skip: Math.max(0, skip) },
            { $limit: Math.max(1, Math.min(100, limit)) },
            { $project: projectionObj },
          ],
          totalArr: [{ $count: 'count' }],
        },
      },
    ]).option({ maxTimeMS: 2000, allowDiskUse: false });

    const items = (aggResult[0]?.items || []).map((d) => ({ ...d, __v: undefined }));
    const total = aggResult[0]?.totalArr?.[0]?.count || 0;
    return { items, total };
  }

  /**
   * Atomic toggle (BUG-H08) — single round-trip using an aggregation pipeline
   * with $cond so we do not need to try-then-retry.
   */
  async toggleStatusAtomically(id, ownerId) {
    return Task.findOneAndUpdate(
      { _id: id, owner: ownerId },
      [
        {
          $set: {
            status: {
              $cond: [{ $eq: ['$status', 'completed'] }, 'pending', 'completed'],
            },
            completedAt: {
              $cond: [{ $eq: ['$status', 'completed'] }, null, '$$NOW'],
            },
          },
        },
      ],
      { new: true, runValidators: true, maxTimeMS: 2000 }
    ).lean();
  }

  updateByIdAndOwner(id, ownerId, update) {
    return Task.findOneAndUpdate({ _id: id, owner: ownerId }, update, {
      new: true,
      runValidators: true,
      maxTimeMS: 2000,
    }).lean();
  }

  deleteByIdAndOwner(id, ownerId) {
    return Task.findOneAndDelete({ _id: id, owner: ownerId }).maxTimeMS(2000);
  }

  countByOwner(ownerId, filter = {}) {
    return Task.countDocuments({ owner: ownerId, ...filter }).maxTimeMS(2000);
  }

  /**
   * Stats aggregation (BUG-H01) — single $group for total + per-status counts.
   */
  async getStatsByAggregation(ownerId) {
    const ownerOid = mongoose.Types.ObjectId.isValid(ownerId)
      ? new mongoose.Types.ObjectId(String(ownerId))
      : ownerId;

    const result = await Task.aggregate([
      { $match: { owner: ownerOid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).option({ maxTimeMS: 2000, allowDiskUse: false });

    const stats = { total: 0, completed: 0, pending: 0 };
    result.forEach((r) => {
      stats[r._id] = r.count;
      stats.total += r.count;
    });
    return stats;
  }
}

module.exports = new TaskRepository();
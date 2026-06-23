const mongoose = require('mongoose');
const { TASK_STATUS, TASK_PRIORITY } = require('../constants');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
    },
    dueDate: { type: Date, default: null },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task owner is required'],
      index: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

taskSchema.index({ owner: 1, status: 1, createdAt: -1 });
// FIX BUG-C07: Drop the global (cross-owner) text index that leaked titles across users.
// Keep only the owner-scoped text index for tenant isolation.
taskSchema.index({ owner: 1, title: 'text', description: 'text' });

taskSchema.pre('save', function trackCompletion(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === TASK_STATUS.COMPLETED ? new Date() : null;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
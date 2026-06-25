const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const taskService = require('../services/task.service');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  return new ApiResponse(StatusCodes.CREATED, { task }, 'Task created').send(res);
});

const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.listTasks(req.user.id, req.query);
  return new ApiResponse(StatusCodes.OK, result, 'Tasks fetched').send(res);
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.id, req.params.id);
  return new ApiResponse(StatusCodes.OK, { task }, 'Task fetched').send(res);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  return new ApiResponse(StatusCodes.OK, { task }, 'Task updated').send(res);
});

const toggleComplete = asyncHandler(async (req, res) => {
  const task = await taskService.toggleComplete(req.user.id, req.params.id);
  return new ApiResponse(StatusCodes.OK, { task }, 'Task toggled').send(res);
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.user.id, req.params.id);
  return new ApiResponse(StatusCodes.OK, result, 'Task deleted').send(res);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getStats(req.user.id);
  return new ApiResponse(StatusCodes.OK, { stats }, 'Stats fetched').send(res);
});

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  toggleComplete,
  deleteTask,
  getStats,
};
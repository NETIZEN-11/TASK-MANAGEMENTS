const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  return new ApiResponse(StatusCodes.CREATED, result, 'Account created').send(res);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return new ApiResponse(StatusCodes.OK, result, 'Logged in').send(res);
});

const me = asyncHandler(async (req, res) => {
  // User is already attached by the auth middleware (req.user).
  return new ApiResponse(StatusCodes.OK, { user: req.user }, 'Current user').send(res);
});

module.exports = { signup, login, me };
const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(statusCode, message, { details = null, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(StatusCodes.BAD_REQUEST, message, { details });
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }
  static conflict(message = 'Conflict') {
    return new ApiError(StatusCodes.CONFLICT, message);
  }
  static internal(message = 'Internal server error') {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, { isOperational: false });
  }
}

module.exports = ApiError;
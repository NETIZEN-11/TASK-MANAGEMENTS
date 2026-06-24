const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

module.exports = function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!value || !mongoose.isValidObjectId(value)) {
      return next(ApiError.notFound('Task not found'));
    }
    return next();
  };
};
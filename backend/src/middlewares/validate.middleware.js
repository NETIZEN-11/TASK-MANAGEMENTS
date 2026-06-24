const ApiError = require('../utils/ApiError');
const { StatusCodes } = require('http-status-codes');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => ({ path: d.path.join('.'), message: d.message }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = value;
    return next();
  };
}

module.exports = { validate, StatusCodes };
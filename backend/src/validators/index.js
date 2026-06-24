const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');
const { TASK_STATUS, TASK_PRIORITY } = require('../constants');

/**
 * FIX BUG-M01: Remove all HTML tags from user-supplied strings before storage.
 * Defense-in-depth — also escaped on output via the DTO.
 */
function sanitizeString(value, helpers) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * FIX BUG-H10: Strong password policy.
 *   - Minimum 8 characters (was 6)
 *   - Must contain at least one letter and one number
 *   - Capped at 128 to bound bcrypt CPU cost
 *
 * Strength could be further increased with a breach-corpus check (e.g. HaveIBeenPwned),
 * but the rules below defeat trivial credential-stuffing passwords like "12345678".
 */
const strongPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Za-z]/, 'letter')
  .pattern(/\d/, 'digit')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must be at most 128 characters',
  });

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required().custom(sanitizeString, 'sanitize'),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: strongPassword,
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required().custom(sanitizeString, 'sanitize'),
  description: Joi.string().allow('').max(1000).default('').custom(sanitizeString, 'sanitize'),
  priority: Joi.string()
    .valid(...Object.values(TASK_PRIORITY))
    .default(TASK_PRIORITY.MEDIUM),
  dueDate: Joi.date().iso().allow(null).default(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).custom(sanitizeString, 'sanitize'),
  description: Joi.string().allow('').max(1000).custom(sanitizeString, 'sanitize'),
  status: Joi.string().valid(...Object.values(TASK_STATUS)),
  priority: Joi.string().valid(...Object.values(TASK_PRIORITY)),
  dueDate: Joi.date().iso().allow(null),
}).min(1);

const listTasksQuerySchema = Joi.object({
  filter: Joi.string().valid('all', 'pending', 'completed', 'search').default('all'),
  q: Joi.string().trim().max(120).allow('').when('filter', {
    is: 'search',
    then: Joi.string().trim().min(1).max(120).required().custom(sanitizeString, 'sanitize'),
    otherwise: Joi.optional(),
  }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  signupSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
};
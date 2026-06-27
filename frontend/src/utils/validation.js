/**
 * Frontend validation utilities
 * Provides client-side validation before API calls
 */

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  // Must contain at least one letter and one number (server-side Joi enforces this).
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  return true;
}

export function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 60;
}

export function validateTaskTitle(title) {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 120;
}

export function validateTaskDescription(description) {
  if (description === null || description === undefined) return true;
  if (typeof description !== 'string') return false;
  return description.length <= 1000;
}

/**
 * Sanitize user input by removing potential XSS vectors
 * This is a basic client-side sanitization - server still validates
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  return input
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate search query
 */
export function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') return false;
  const trimmed = query.trim();
  return trimmed.length >= 1 && trimmed.length <= 120;
}

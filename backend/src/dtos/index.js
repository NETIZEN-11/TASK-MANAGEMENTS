/**
 * Defense-in-depth output sanitization (BUG-C07).
 *
 * Even though Joi strips HTML on input, we re-escape on output to defend against:
 *   1. Future code paths that bypass Joi validation
 *   2. Stored XSS payloads rendered through dangerouslySetInnerHTML or attribute injection
 *   3. Third-party integrations (email, RSS) that may not escape
 */
const escapeHtml = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  return value.replace(/[<>&"']/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
};

const toUserDto = (userDoc) => {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    id: obj._id?.toString(),
    name: escapeHtml(obj.name),
    email: obj.email, // Email format is constrained by Joi — do not escape (RFC requires unescaped)
    role: obj.role,
    createdAt: obj.createdAt,
  };
};

const toTaskDto = (taskDoc) => {
  if (!taskDoc) return null;
  const obj = taskDoc.toObject ? taskDoc.toObject() : taskDoc;
  return {
    id: obj._id?.toString(),
    title: escapeHtml(obj.title),
    description: escapeHtml(obj.description || ''),
    status: obj.status,
    priority: obj.priority,
    dueDate: obj.dueDate,
    owner: obj.owner?.toString ? obj.owner.toString() : obj.owner,
    completedAt: obj.completedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    ...(typeof obj.score === 'number' ? { score: obj.score } : {}),
  };
};

module.exports = { toUserDto, toTaskDto, escapeHtml };
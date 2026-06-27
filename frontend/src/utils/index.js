export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}
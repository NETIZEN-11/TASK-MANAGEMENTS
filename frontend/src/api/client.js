import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Monotonic request id used for client-side correlation in logs.
 * `crypto.randomUUID()` would also work — we keep the counter purely for
 * readability in logs (compact base36 form).
 */
let nextRequestId = 0;
const mintRequestId = () => `fe-${Date.now().toString(36)}-${(++nextRequestId).toString(36)}`;

apiClient.interceptors.request.use((config) => {
  let token = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const { token: t } = JSON.parse(raw);
      if (typeof t === 'string' && t.length > 0) token = t;
    }
  } catch {
    // Corrupted localStorage — treat as logged out.
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Request-Id'] = mintRequestId();
  return config;
});

/**
 * FIX BUG-C08: Wrap rejections in a real Error subclass so callers can use
 * `err instanceof Error`, `err.message`, and `err.response` interchangeably.
 *
 * FIX BUG-M06: Only fire `session:expired` when we actually sent a token —
 * otherwise a 401 on /login (bad credentials) would log out the user.
 */
class ApiError extends Error {
  constructor({ status, message, details, requestId, response }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.response = response;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cancellation bubbles up unchanged so AbortController users can distinguish.
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong';
    const details = error?.response?.data?.details;
    const requestId = error?.response?.data?.requestId;

    if (status === 401) {
      // Only fire session:expired if we actually authenticated this request.
      const hadToken = !!error?.config?.headers?.Authorization;
      if (hadToken) {
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH);
        } catch {
          /* localStorage may be unavailable */
        }
        window.dispatchEvent(new CustomEvent('session:expired'));
      }
    }

    const wrapped = new ApiError({
      status,
      message,
      details,
      requestId,
      response: error?.response,
    });
    return Promise.reject(wrapped);
  }
);

export default apiClient;
export { ApiError };
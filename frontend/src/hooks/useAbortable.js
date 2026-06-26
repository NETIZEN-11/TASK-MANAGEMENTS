import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Debounce a value — updates `debounced` only after `delayMs` of stability.
 */
export function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * FIX BUG-H05 + BUG-M11: properly track mounted state and surface cancellation.
 * Returns:
 *   - run(fn): executes fn(signal), aborts the previous in-flight request first.
 *   - abort(): explicitly aborts the current request (used on filter change / unmount).
 */
export function useAbortableEffect() {
  const ctrlRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ctrlRef.current?.abort();
      ctrlRef.current = null;
    };
  }, []);

  const run = useCallback((asyncFn) => {
    // Abort any in-flight request before issuing the new one.
    ctrlRef.current?.abort();

    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    return asyncFn(ctrl.signal).catch((err) => {
      // Surface cancellation cleanly to callers so they can branch.
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return Promise.reject(err);
      }
      throw err;
    });
  }, []);

  const abort = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  return { run, abort };
}
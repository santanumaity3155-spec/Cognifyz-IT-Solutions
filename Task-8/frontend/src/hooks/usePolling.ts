import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export const usePolling = (callback: () => Promise<void> | void, options: UsePollingOptions = {}) => {
  const { intervalMs = 4000, enabled = true } = options;
  const [isActive, setIsActive] = useState(enabled);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let timeoutId: any;
    let isMounted = true;

    const tick = async () => {
      if (document.hidden) {
        // Skip tick when tab is not visible
        timeoutId = setTimeout(tick, intervalMs);
        return;
      }

      try {
        await callbackRef.current();
      } catch (err) {
        console.warn('[POLLING ERROR]', err);
      }

      if (isMounted && isActive) {
        timeoutId = setTimeout(tick, intervalMs);
      }
    };

    timeoutId = setTimeout(tick, intervalMs);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isActive, intervalMs]);

  return { isActive, toggle, setIsActive };
};

export default usePolling;


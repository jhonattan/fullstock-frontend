import { useCallback, useRef, useEffect } from "react";

/**
 * Custom hook for debouncing function calls
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const debounceTimer = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for throttling function calls
 * @param callback - Function to throttle
 * @param limit - Limit in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  limit: number,
): T {
  const inThrottle = useRef(false);
  const lastFunc = useRef<NodeJS.Timeout>();
  const lastRan = useRef<number>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        lastRan.current = Date.now();
        inThrottle.current = true;
      } else {
        if (lastFunc.current) {
          clearTimeout(lastFunc.current);
        }
        lastFunc.current = setTimeout(() => {
          if (Date.now() - (lastRan.current || 0) >= limit) {
            callback(...args);
            lastRan.current = Date.now();
          }
        }, limit - (Date.now() - (lastRan.current || 0)));
      }
    },
    [callback, limit],
  ) as T;

  useEffect(() => {
    return () => {
      if (lastFunc.current) {
        clearTimeout(lastFunc.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Hook for optimizing search interactions
 * @param onSearch - Search callback function
 * @param delay - Debounce delay (default: 300ms)
 */
export function useDebouncedSearch(
  onSearch: (term: string) => void,
  delay: number = 300,
) {
  const debouncedSearch = useDebounce(onSearch, delay);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      // Immediate UI update, debounced search
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  return { handleSearchChange };
}

/**
 * Hook for optimizing form submissions
 * @param onSubmit - Submit callback function
 * @param delay - Debounce delay (default: 500ms)
 */
export function useDebouncedSubmit(
  onSubmit: (data: any) => void | Promise<void>,
  delay: number = 500,
) {
  const isSubmitting = useRef(false);

  const debouncedSubmit = useDebounce(async (data: any) => {
    if (isSubmitting.current) return;

    isSubmitting.current = true;
    try {
      await onSubmit(data);
    } finally {
      // Reset after a delay to prevent rapid resubmissions
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  }, delay);

  return { debouncedSubmit, isSubmitting: isSubmitting.current };
}

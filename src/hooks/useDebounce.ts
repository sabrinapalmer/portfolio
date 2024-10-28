import { useCallback } from "react";

export const useDebounce = (func: Function, wait: number) => {
  return useCallback(
    (...args: any[]) => {
      let timeout: ReturnType<typeof setTimeout>;
      return new Promise((resolve) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => resolve(func(...args)), wait);
      });
    },
    [func, wait]
  );
};

// Alternatively, if you want to use it without Promise
export const useDebounceSimple = (func: Function, wait: number) => {
  return useCallback(
    (...args: any[]) => {
      let timeoutId: number;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => func(...args), wait);
      };
    },
    [func, wait]
  );
};

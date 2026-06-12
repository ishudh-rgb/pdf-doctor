"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseConversionProgressOptions {
  /** Max simulated progress while waiting on server (default 92). */
  cap?: number;
  /** Tick interval in ms (default 450). */
  intervalMs?: number;
}

export function useConversionProgress({
  cap = 92,
  intervalMs = 450,
}: UseConversionProgressOptions = {}) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
  }, [stop]);

  const start = useCallback(() => {
    stop();
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= cap) return current;
        const step = current < 40 ? 4 : current < 75 ? 2 : 1;
        return Math.min(cap, current + step);
      });
    }, intervalMs);
  }, [cap, intervalMs, stop]);

  const complete = useCallback(() => {
    stop();
    setProgress(100);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { progress, start, stop, complete, reset };
}

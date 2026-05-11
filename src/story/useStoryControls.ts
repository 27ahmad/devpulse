import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

interface StoryControls {
  index: number;
  progress: number;
  paused: boolean;
  next: () => void;
  prev: () => void;
  goTo: (i: number) => void;
  setPaused: (p: boolean) => void;
}

export function useStoryControls(
  sceneCount: number,
  durations: number[],
  onComplete: () => void
): StoryControls {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= sceneCount) {
        onCompleteRef.current();
        return i;
      }
      return i + 1;
    });
    setProgress(0);
  }, [sceneCount]);

  const next = advance;

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
    setProgress(0);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(sceneCount - 1, i)));
      setProgress(0);
    },
    [sceneCount]
  );

  useEffect(() => {
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        elapsed += dt;
        const dur = durations[index] ?? 4000;
        const p = Math.min(1, elapsed / dur);
        setProgress(p);
        if (p >= 1) {
          setIndex((i) => {
            if (i + 1 >= sceneCount) {
              onCompleteRef.current();
              return i;
            }
            return i + 1;
          });
          setProgress(0);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, paused, durations, sceneCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return { index, progress, paused, next, prev, goTo, setPaused };
}

function subscribeReducedMotion(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false
  );
}

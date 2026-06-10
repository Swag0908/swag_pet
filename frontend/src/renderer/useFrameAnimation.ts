import { useEffect, useMemo, useState } from "react";
import type { AnimationName, PetManifest } from "../shared/types";

export function useFrameAnimation(
  animation: AnimationName,
  manifest: PetManifest | null,
  frameUrls: Record<AnimationName, string[]> | null,
  onAnimationEnd: () => void
): string | null {
  const [frameIndex, setFrameIndex] = useState(0);

  const spec = manifest?.animations[animation] ?? null;
  const frames = useMemo(() => frameUrls?.[animation] ?? frameUrls?.idle ?? [], [animation, frameUrls]);

  useEffect(() => {
    setFrameIndex(0);
  }, [animation]);

  useEffect(() => {
    if (!spec || frames.length === 0) {
      return;
    }

    const intervalMs = Math.round(1000 / Math.max(spec.fps, 1));
    const timer = window.setInterval(() => {
      setFrameIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= frames.length) {
          if (!spec.loop) {
            window.clearInterval(timer);
            window.setTimeout(onAnimationEnd, 0);
            return currentIndex;
          }
          return 0;
        }

        return nextIndex;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [frames.length, onAnimationEnd, spec]);

  return frames[frameIndex] ?? frames[0] ?? null;
}

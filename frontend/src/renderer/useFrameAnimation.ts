import { useEffect, useMemo, useState } from "react";
import type { AnimationName, PetManifest } from "../shared/types";
import type { LoadedPet } from "./petAssets";

export function useAnimationFrameIndex(
  animation: AnimationName,
  manifest: PetManifest | null,
  loadedPet: LoadedPet | null,
  onAnimationEnd: () => void
): number {
  const [frameIndex, setFrameIndex] = useState(0);

  const spec = manifest?.animations[animation] ?? null;
  const frameCount = useMemo(() => {
    if (!loadedPet) {
      return 0;
    }

    if (loadedPet.source === "spritesheet") {
      return (loadedPet.frameIndexes[animation] ?? loadedPet.frameIndexes.idle ?? []).length;
    }

    return (loadedPet.frameUrls[animation] ?? loadedPet.frameUrls.idle ?? []).length;
  }, [animation, loadedPet]);

  useEffect(() => {
    setFrameIndex(0);
  }, [animation]);

  useEffect(() => {
    if (!spec || frameCount === 0) {
      return;
    }

    const intervalMs = Math.round(1000 / Math.max(spec.fps, 1));
    const timer = window.setInterval(() => {
      setFrameIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;

        if (nextIndex >= frameCount) {
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
  }, [frameCount, onAnimationEnd, spec]);

  return frameIndex;
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimationName, PetState, Point } from "../shared/types";
import { loadPetManifest, type LoadedPet } from "./petAssets";
import { RuleBasedPetBrain } from "./petBrain";
import { useFrameAnimation } from "./useFrameAnimation";

const decayIntervalMs = 20000;
const behaviorIntervalMs = 12000;
const sleepAfterMs = 45000;

export function App(): JSX.Element {
  const brain = useMemo(() => new RuleBasedPetBrain(), []);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [loadedPet, setLoadedPet] = useState<LoadedPet | null>(null);
  const [animation, setAnimation] = useState<AnimationName>("idle");
  const [message, setMessage] = useState("正在醒来...");
  const [isDragging, setIsDragging] = useState(false);
  const suppressNextClick = useRef(false);

  const persistState = useCallback(async (patch: Partial<PetState>) => {
    const nextState = await window.swagPet.updateState(patch);
    setPetState(nextState);
    return nextState;
  }, []);

  const runBrain = useCallback(
    async (event: Parameters<RuleBasedPetBrain["respond"]>[0]["event"]) => {
      if (!petState) {
        return;
      }
      const response = brain.respond({ event, state: petState });
      setAnimation(response.animation);
      setMessage(response.message);

      if (response.statePatch) {
        await persistState(response.statePatch);
      }
    },
    [brain, persistState, petState]
  );

  const endOneShotAnimation = useCallback(() => {
    setAnimation((current) => (current === "tap" || current === "happy" ? "idle" : current));
  }, []);

  const currentFrame = useFrameAnimation(
    animation,
    loadedPet?.manifest ?? null,
    loadedPet?.frameUrls ?? null,
    endOneShotAnimation
  );

  useEffect(() => {
    let mounted = true;

    window.swagPet
      .getState()
      .then(async (state) => {
        if (!mounted) {
          return;
        }
        setPetState(state);
        const pet = await loadPetManifest(state.petId);
        if (mounted) {
          setLoadedPet(pet);
          setMessage(`${pet.manifest.name} 来了。`);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize Swag Pet.", error);
        if (mounted) {
          setMessage("宠物资源加载失败。");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!petState) {
      return;
    }

    const timer = window.setInterval(() => {
      persistState({
        mood: Math.max(0, petState.mood - 1),
        energy: Math.max(0, petState.energy - 1)
      });
    }, decayIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [persistState, petState]);

  useEffect(() => {
    if (!petState) {
      return;
    }

    const timer = window.setInterval(() => {
      const idleForMs = Date.now() - new Date(petState.lastInteractionAt).getTime();
      const event = idleForMs > sleepAfterMs || petState.energy < 30 ? "sleepTick" : "idleTick";
      runBrain(event);
    }, behaviorIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [petState, runBrain]);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const point = toPoint(event);
    setIsDragging(true);
    suppressNextClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    window.swagPet.dragStart(point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) {
      return;
    }

    suppressNextClick.current = true;
    window.swagPet.dragMove(toPoint(event));
  };

  const handlePointerUp = async (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    const nextState = await window.swagPet.dragEnd();
    setPetState(nextState);
  };

  const handlePetClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }

    runBrain("tap");
  };

  const handleFeed = () => {
    runBrain("feed");
  };

  if (!petState || !loadedPet) {
    return <main className="pet-shell loading">...</main>;
  }

  return (
    <main className="pet-shell" aria-label="Swag Pet">
      <div className="speech-bubble" role="status">
        {message}
      </div>
      <button
        className="pet-button"
        type="button"
        aria-label="互动"
        onClick={handlePetClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {currentFrame ? <img className="pet-frame" src={currentFrame} alt="" draggable={false} /> : null}
      </button>
      <div className="pet-controls" aria-label="宠物状态">
        <button type="button" onClick={handleFeed} title="喂食">
          +
        </button>
        <span title="心情">M {petState.mood}</span>
        <span title="精力">E {petState.energy}</span>
        <span title="亲密度">Lv {Math.floor(petState.affinity / 10) + 1}</span>
      </div>
    </main>
  );
}

function toPoint(event: React.PointerEvent): Point {
  return {
    x: event.screenX,
    y: event.screenY
  };
}

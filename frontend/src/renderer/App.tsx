import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimationName, PetState, Point } from "../shared/types";
import { clampPetScale, stepPetScale } from "../shared/scale";
import { loadPetManifest, type LoadedPet } from "./petAssets";
import { RuleBasedPetBrain } from "./petBrain";
import { useAnimationFrameIndex } from "./useFrameAnimation";

const decayIntervalMs = 20000;
const behaviorIntervalMs = 12000;
const sleepAfterMs = 45000;
const contextMenuSize = {
  width: 154,
  height: 132
};

export function App(): JSX.Element {
  const brain = useMemo(() => new RuleBasedPetBrain(), []);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [loadedPet, setLoadedPet] = useState<LoadedPet | null>(null);
  const [animation, setAnimation] = useState<AnimationName>("idle");
  const [message, setMessage] = useState("正在醒来...");
  const [isDragging, setIsDragging] = useState(false);
  const [isScaleMode, setIsScaleMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<Point | null>(null);
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

  const frameIndex = useAnimationFrameIndex(
    animation,
    loadedPet?.manifest ?? null,
    loadedPet,
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

  useEffect(() => {
    const closeMenu = () => {
      setContextMenu(null);
    };

    window.addEventListener("pointerdown", closeMenu);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
    };
  }, []);

  const updateSettings = useCallback(
    async (settingsPatch: Partial<PetState["settings"]>) => {
      if (!petState) {
        return null;
      }

      return persistState({
        settings: {
          ...petState.settings,
          ...settingsPatch
        }
      });
    },
    [persistState, petState]
  );

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

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const boundedX = Math.max(8, Math.min(event.clientX, window.innerWidth - contextMenuSize.width - 8));
    const boundedY = Math.max(8, Math.min(event.clientY, window.innerHeight - contextMenuSize.height - 8));
    setContextMenu({
      x: boundedX,
      y: boundedY
    });
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!petState || !isScaleMode) {
      return;
    }

    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    void updateSettings({
      petScale: stepPetScale(petState.settings.petScale, direction)
    });
  };

  const resetPosition = async () => {
    setContextMenu(null);
    const nextState = await window.swagPet.resetPosition();
    setPetState(nextState);
  };

  if (!petState || !loadedPet) {
    return <main className="pet-shell loading">...</main>;
  }

  const scalePercent = Math.round(clampPetScale(petState.settings.petScale) * 100);
  const showStatusBar = petState.settings.showStatusBar;

  return (
    <main
      className={`pet-shell${isScaleMode ? " scaling" : ""}`}
      aria-label="Swag Pet"
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      style={{ "--pet-scale": petState.settings.petScale } as React.CSSProperties}
    >
      <div className="speech-bubble" role="status">
        {message}
      </div>
      {isScaleMode ? <div className="scale-hint">滚轮缩放 {scalePercent}%</div> : null}
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
        <PetFrame loadedPet={loadedPet} animation={animation} frameIndex={frameIndex} />
      </button>
      {showStatusBar ? (
        <div className="pet-controls" aria-label="宠物状态">
          <button type="button" onClick={handleFeed} title="喂食">
            喂食
          </button>
          <span title="心情">心情 {petState.mood}</span>
          <span title="精力">精力 {petState.energy}</span>
          <span title="亲密度">亲密 {Math.floor(petState.affinity / 10) + 1}</span>
        </div>
      ) : null}
      {contextMenu ? (
        <div
          className="pet-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setContextMenu(null);
              void updateSettings({ showStatusBar: !showStatusBar });
            }}
          >
            {showStatusBar ? "隐藏状态栏" : "显示状态栏"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setContextMenu(null);
              setIsScaleMode((current) => !current);
            }}
          >
            {isScaleMode ? "退出缩放模式" : "进入缩放模式"}
          </button>
          <button type="button" role="menuitem" onClick={resetPosition}>
            重置位置
          </button>
        </div>
      ) : null}
    </main>
  );
}

interface PetFrameProps {
  loadedPet: LoadedPet;
  animation: AnimationName;
  frameIndex: number;
}

function PetFrame({ loadedPet, animation, frameIndex }: PetFrameProps): JSX.Element | null {
  if (loadedPet.source === "spritesheet") {
    const frames = loadedPet.frameIndexes[animation] ?? loadedPet.frameIndexes.idle;
    const spriteIndex = frames[frameIndex] ?? frames[0] ?? 0;
    const column = spriteIndex % loadedPet.columns;
    const row = Math.floor(spriteIndex / loadedPet.columns);
    const x = loadedPet.columns > 1 ? (column / (loadedPet.columns - 1)) * 100 : 0;
    const y = loadedPet.rows > 1 ? (row / (loadedPet.rows - 1)) * 100 : 0;

    return (
      <span
        className="pet-frame pet-sprite"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${loadedPet.spritesheetUrl}")`,
          backgroundSize: `${loadedPet.columns * 100}% ${loadedPet.rows * 100}%`,
          backgroundPosition: `${x}% ${y}%`
        }}
      />
    );
  }

  const frames = loadedPet.frameUrls[animation] ?? loadedPet.frameUrls.idle;
  const currentFrame = frames[frameIndex] ?? frames[0] ?? null;

  return currentFrame ? <img className="pet-frame" src={currentFrame} alt="" draggable={false} /> : null;
}

function toPoint(event: React.PointerEvent): Point {
  return {
    x: event.screenX,
    y: event.screenY
  };
}

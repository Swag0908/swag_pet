import type { PetState, Point, SwagPetApi } from "../shared/types";
import { clampPetScale } from "../shared/scale";

const storageKey = "swag-pet-preview-state";

export function installBrowserPreviewApi(): void {
  if (window.swagPet) {
    return;
  }

  let state = loadPreviewState();

  const api: SwagPetApi = {
    getState: async () => structuredClone(state),
    updateState: async (patch: Partial<PetState>) => {
      state = sanitizePreviewState({
        ...state,
        ...patch,
        settings: {
          ...state.settings,
          ...patch.settings
        },
        position: {
          ...state.position,
          ...patch.position
        }
      });
      savePreviewState(state);
      return structuredClone(state);
    },
    resizeWindow: async () => undefined,
    dragStart: async () => undefined,
    dragMove: async () => undefined,
    dragEnd: async () => structuredClone(state),
    resetPosition: async () => {
      state = {
        ...state,
        position: defaultPosition()
      };
      savePreviewState(state);
      return structuredClone(state);
    }
  };

  window.swagPet = api;
}

function loadPreviewState(): PetState {
  const fallback = createPreviewState();

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      savePreviewState(fallback);
      return fallback;
    }

    return sanitizePreviewState({
      ...fallback,
      ...(JSON.parse(raw) as Partial<PetState>),
      settings: {
        ...fallback.settings,
        ...(JSON.parse(raw) as Partial<PetState>).settings
      }
    });
  } catch (error) {
    console.warn("Failed to load browser preview state, falling back to defaults.", error);
    savePreviewState(fallback);
    return fallback;
  }
}

function sanitizePreviewState(state: PetState): PetState {
  return {
    ...state,
    settings: {
      ...state.settings,
      petScale: clampPetScale(state.settings.petScale),
      showStatusBar: state.settings.showStatusBar ?? false
    }
  };
}

function savePreviewState(state: PetState): void {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function createPreviewState(): PetState {
  const now = new Date().toISOString();

  return {
    petId: "default-pet",
    position: defaultPosition(),
    mood: 80,
    energy: 70,
    affinity: 1,
    createdAt: now,
    lastInteractionAt: now,
    settings: {
      alwaysOnTop: true,
      launchAtLogin: false,
      soundEnabled: false,
      petScale: 1,
      showStatusBar: false
    }
  };
}

function defaultPosition(): Point {
  return {
    x: Math.max(0, window.innerWidth - 320),
    y: Math.max(0, window.innerHeight - 340)
  };
}

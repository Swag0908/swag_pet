import fs from "node:fs";
import path from "node:path";
import type { PetState, Point } from "../shared/types";

const stateFileName = "pet-state.json";

export function createDefaultPetState(position: Point, now = new Date()): PetState {
  const isoTime = now.toISOString();

  return {
    petId: "default-pet",
    position,
    mood: 80,
    energy: 70,
    affinity: 1,
    createdAt: isoTime,
    lastInteractionAt: isoTime,
    settings: {
      alwaysOnTop: true,
      launchAtLogin: false,
      soundEnabled: false
    }
  };
}

export class StateStore {
  private readonly filePath: string;
  private state: PetState;

  constructor(userDataPath: string, defaultPosition: Point) {
    this.filePath = path.join(userDataPath, stateFileName);
    this.state = this.load(defaultPosition);
  }

  get(): PetState {
    return structuredClone(this.state);
  }

  update(patch: Partial<PetState>): PetState {
    this.state = sanitizeState({
      ...this.state,
      ...patch,
      settings: {
        ...this.state.settings,
        ...patch.settings
      },
      position: {
        ...this.state.position,
        ...patch.position
      }
    });
    this.save();
    return this.get();
  }

  private load(defaultPosition: Point): PetState {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      const defaultState = createDefaultPetState(defaultPosition);
      fs.writeFileSync(this.filePath, JSON.stringify(defaultState, null, 2), "utf8");
      return defaultState;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      return sanitizeState(JSON.parse(raw) as Partial<PetState>, defaultPosition);
    } catch (error) {
      console.warn("Failed to load pet state, falling back to defaults.", error);
      return createDefaultPetState(defaultPosition);
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
}

export function sanitizeState(rawState: Partial<PetState>, fallbackPosition: Point = { x: 1200, y: 720 }): PetState {
  const now = new Date().toISOString();

  return {
    petId: typeof rawState.petId === "string" ? rawState.petId : "default-pet",
    position: {
      x: finiteNumber(rawState.position?.x, fallbackPosition.x),
      y: finiteNumber(rawState.position?.y, fallbackPosition.y)
    },
    mood: clamp(finiteNumber(rawState.mood, 80), 0, 100),
    energy: clamp(finiteNumber(rawState.energy, 70), 0, 100),
    affinity: Math.max(1, Math.round(finiteNumber(rawState.affinity, 1))),
    createdAt: typeof rawState.createdAt === "string" ? rawState.createdAt : now,
    lastInteractionAt: typeof rawState.lastInteractionAt === "string" ? rawState.lastInteractionAt : now,
    settings: {
      alwaysOnTop: rawState.settings?.alwaysOnTop ?? true,
      launchAtLogin: rawState.settings?.launchAtLogin ?? false,
      soundEnabled: rawState.settings?.soundEnabled ?? false
    }
  };
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

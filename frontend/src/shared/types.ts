export type AnimationName = "idle" | "walk" | "sleep" | "happy" | "tap";

export interface Point {
  x: number;
  y: number;
}

export interface PetSettings {
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  soundEnabled: boolean;
}

export interface PetState {
  petId: string;
  position: Point;
  mood: number;
  energy: number;
  affinity: number;
  createdAt: string;
  lastInteractionAt: string;
  settings: PetSettings;
}

export interface AnimationSpec {
  fps: number;
  loop: boolean;
  frames: string[];
}

export interface PetManifest {
  id: string;
  name: string;
  version: string;
  style: "pixel";
  animations: Record<AnimationName, AnimationSpec>;
}

export type PetEventType = "tap" | "idleTick" | "sleepTick" | "wake" | "feed";

export interface PetBrainInput {
  event: PetEventType;
  state: PetState;
}

export interface PetBrainResponse {
  message: string;
  animation: AnimationName;
  statePatch?: Partial<Pick<PetState, "mood" | "energy" | "affinity" | "lastInteractionAt">>;
}

export interface SwagPetApi {
  getState: () => Promise<PetState>;
  updateState: (patch: Partial<PetState>) => Promise<PetState>;
  dragStart: (screenPoint: Point) => Promise<void>;
  dragMove: (screenPoint: Point) => Promise<void>;
  dragEnd: () => Promise<PetState>;
  resetPosition: () => Promise<PetState>;
}

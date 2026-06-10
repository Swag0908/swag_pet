export type AnimationName = "idle" | "walk" | "sleep" | "happy" | "tap";

export interface Point {
  x: number;
  y: number;
}

export interface PetSettings {
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
  soundEnabled: boolean;
  petScale: number;
  showStatusBar: boolean;
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

export interface FrameListAnimationSpec {
  fps: number;
  loop: boolean;
  frames: string[];
}

export interface SpriteSheetAnimationSpec {
  fps: number;
  loop: boolean;
  frames: number[];
}

export type AnimationSpec = FrameListAnimationSpec | SpriteSheetAnimationSpec;

export interface SpriteSheetSpec {
  path: string;
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
}

export interface PetManifest {
  id: string;
  name: string;
  version: string;
  style: "pixel";
  spritesheet?: SpriteSheetSpec;
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
  resizeWindow: (state: PetState) => Promise<void>;
  dragStart: (screenPoint: Point) => Promise<void>;
  dragMove: (screenPoint: Point) => Promise<void>;
  dragEnd: () => Promise<PetState>;
  resetPosition: () => Promise<PetState>;
}

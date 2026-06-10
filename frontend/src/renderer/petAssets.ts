import type { AnimationName, AnimationSpec, FrameListAnimationSpec, PetManifest, SpriteSheetAnimationSpec } from "../shared/types";

const fallbackAnimation: AnimationName = "idle";

export type LoadedPet =
  | {
      source: "frames";
      manifest: PetManifest;
      frameUrls: Record<AnimationName, string[]>;
    }
  | {
      source: "spritesheet";
      manifest: PetManifest;
      spritesheetUrl: string;
      frameWidth: number;
      frameHeight: number;
      columns: number;
      rows: number;
      frameIndexes: Record<AnimationName, number[]>;
    };

export async function loadPetManifest(petId: string): Promise<LoadedPet> {
  const base = import.meta.env.BASE_URL || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const manifestUrl = new URL(`${normalizedBase}pets/${folderForPetId(petId)}/pet.json`, window.location.href).toString();
  const response = await fetch(manifestUrl);

  if (!response.ok) {
    throw new Error(`Failed to load pet manifest: ${manifestUrl}`);
  }

  const manifest = (await response.json()) as PetManifest;
  const petBase = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);

  if (manifest.spritesheet) {
    const idleFrames = normalizeSpriteFrames(manifest.animations.idle);
    const frameIndexes = {} as Record<AnimationName, number[]>;

    for (const animation of Object.keys(manifest.animations) as AnimationName[]) {
      const frames = normalizeSpriteFrames(manifest.animations[animation]);
      frameIndexes[animation] = frames.length > 0 ? frames : idleFrames;

      if (frames.length === 0) {
        console.warn(`Animation "${animation}" has no sprite frames. Falling back to "${fallbackAnimation}".`);
      }
    }

    return {
      source: "spritesheet",
      manifest,
      spritesheetUrl: new URL(manifest.spritesheet.path, petBase).toString(),
      frameWidth: manifest.spritesheet.frameWidth,
      frameHeight: manifest.spritesheet.frameHeight,
      columns: manifest.spritesheet.columns,
      rows: manifest.spritesheet.rows,
      frameIndexes
    };
  }

  const idleFrames = normalizeFrames(manifest.animations.idle, petBase);
  const frameUrls = {} as Record<AnimationName, string[]>;

  for (const animation of Object.keys(manifest.animations) as AnimationName[]) {
    const frames = normalizeFrames(manifest.animations[animation], petBase);
    frameUrls[animation] = frames.length > 0 ? frames : idleFrames;

    if (frames.length === 0) {
      console.warn(`Animation "${animation}" has no frames. Falling back to "${fallbackAnimation}".`);
    }
  }

  return {
    source: "frames",
    manifest,
    frameUrls
  };
}

function folderForPetId(petId: string): string {
  if (petId === "default-pet") {
    return "default";
  }

  return petId.replace(/[^a-zA-Z0-9-_]/g, "");
}

function normalizeFrames(spec: AnimationSpec | undefined, petBase: string): string[] {
  if (!isFrameListSpec(spec)) {
    return [];
  }

  return spec.frames.map((frame) => new URL(frame, petBase).toString());
}

function normalizeSpriteFrames(spec: AnimationSpec | undefined): number[] {
  if (!isSpriteSheetSpec(spec)) {
    return [];
  }

  return spec.frames.filter((frame) => Number.isInteger(frame) && frame >= 0);
}

function isFrameListSpec(spec: AnimationSpec | undefined): spec is FrameListAnimationSpec {
  return Boolean(spec && spec.frames.length > 0) && typeof spec!.frames[0] === "string";
}

function isSpriteSheetSpec(spec: AnimationSpec | undefined): spec is SpriteSheetAnimationSpec {
  return Boolean(spec && spec.frames.length > 0) && typeof spec!.frames[0] === "number";
}

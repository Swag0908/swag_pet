import type { AnimationName, AnimationSpec, PetManifest } from "../shared/types";

const fallbackAnimation: AnimationName = "idle";

export interface LoadedPet {
  manifest: PetManifest;
  frameUrls: Record<AnimationName, string[]>;
}

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
  if (!spec?.frames?.length) {
    return [];
  }

  return spec.frames.map((frame) => new URL(frame, petBase).toString());
}

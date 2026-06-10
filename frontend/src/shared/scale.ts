export const minPetScale = 0.5;
export const maxPetScale = 2.5;
export const petScaleStep = 0.05;

export function clampPetScale(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return roundPetScale(Math.min(maxPetScale, Math.max(minPetScale, value)));
}

export function stepPetScale(currentScale: number, direction: 1 | -1): number {
  return clampPetScale(currentScale + direction * petScaleStep);
}

function roundPetScale(value: number): number {
  return Math.round(value * 100) / 100;
}

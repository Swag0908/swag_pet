import { describe, expect, it } from "vitest";
import { clampPetScale, stepPetScale } from "../shared/scale";

describe("pet scale", () => {
  it("clamps values into the supported range", () => {
    expect(clampPetScale(0.1)).toBe(0.5);
    expect(clampPetScale(3)).toBe(2.5);
  });

  it("steps by five percent", () => {
    expect(stepPetScale(1, 1)).toBe(1.05);
    expect(stepPetScale(1, -1)).toBe(0.95);
  });
});

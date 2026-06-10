import { describe, expect, it } from "vitest";
import type { PetState } from "../shared/types";
import { RuleBasedPetBrain } from "../renderer/petBrain";

const baseState: PetState = {
  petId: "default-pet",
  position: { x: 100, y: 100 },
  mood: 80,
  energy: 70,
  affinity: 1,
  createdAt: "2026-06-10T00:00:00.000Z",
  lastInteractionAt: "2026-06-10T00:00:00.000Z",
  settings: {
    alwaysOnTop: true,
    launchAtLogin: false,
    soundEnabled: false
  }
};

describe("RuleBasedPetBrain", () => {
  it("responds to taps with a tap animation and affinity growth", () => {
    const brain = new RuleBasedPetBrain();
    const response = brain.respond({ event: "tap", state: baseState });

    expect(response.animation).toBe("tap");
    expect(response.message.length).toBeGreaterThan(0);
    expect(response.statePatch?.affinity).toBe(2);
  });

  it("chooses sleep when energy is low", () => {
    const brain = new RuleBasedPetBrain();
    const response = brain.respond({
      event: "idleTick",
      state: {
        ...baseState,
        energy: 10
      }
    });

    expect(response.animation).toBe("sleep");
    expect(response.statePatch?.energy).toBeGreaterThan(10);
  });
});

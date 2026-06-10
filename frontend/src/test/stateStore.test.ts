import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDefaultPetState, sanitizeState, StateStore } from "../main/stateStore";

describe("StateStore", () => {
  it("creates a default state on first launch", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "swag-pet-"));
    const store = new StateStore(tempDir, { x: 10, y: 20 });

    expect(store.get()).toMatchObject({
      petId: "default-pet",
      position: { x: 10, y: 20 },
      mood: 80,
      energy: 70,
      affinity: 1
    });
    expect(fs.existsSync(path.join(tempDir, "pet-state.json"))).toBe(true);
  });

  it("falls back to defaults when the state file is invalid", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "swag-pet-"));
    fs.writeFileSync(path.join(tempDir, "pet-state.json"), "{broken", "utf8");

    const store = new StateStore(tempDir, { x: 30, y: 40 });

    expect(store.get().position).toEqual({ x: 30, y: 40 });
    expect(store.get().mood).toBe(80);
  });

  it("sanitizes numeric ranges", () => {
    const state = sanitizeState({
      ...createDefaultPetState({ x: 0, y: 0 }),
      mood: 999,
      energy: -20,
      affinity: -1
    });

    expect(state.mood).toBe(100);
    expect(state.energy).toBe(0);
    expect(state.affinity).toBe(1);
  });
});

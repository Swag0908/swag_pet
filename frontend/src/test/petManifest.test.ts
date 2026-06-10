import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { PetManifest } from "../shared/types";

describe("pet manifest shapes", () => {
  it("supports frame-list manifests", () => {
    const manifest: PetManifest = {
      id: "frame-pet",
      name: "Frame Pet",
      version: "1.0.0",
      style: "pixel",
      animations: {
        idle: { fps: 6, loop: true, frames: ["idle-0.svg"] },
        walk: { fps: 6, loop: true, frames: ["walk-0.svg"] },
        sleep: { fps: 6, loop: true, frames: ["sleep-0.svg"] },
        happy: { fps: 6, loop: false, frames: ["happy-0.svg"] },
        tap: { fps: 6, loop: false, frames: ["tap-0.svg"] }
      }
    };

    expect(typeof manifest.animations.idle.frames[0]).toBe("string");
  });

  it("supports spritesheet manifests", () => {
    const manifest: PetManifest = {
      id: "sheet-pet",
      name: "Sheet Pet",
      version: "1.0.0",
      style: "pixel",
      spritesheet: {
        path: "spritesheet.png",
        frameWidth: 256,
        frameHeight: 256,
        columns: 4,
        rows: 5
      },
      animations: {
        idle: { fps: 6, loop: true, frames: [0, 1] },
        walk: { fps: 6, loop: true, frames: [4, 5] },
        sleep: { fps: 6, loop: true, frames: [8, 9] },
        happy: { fps: 6, loop: false, frames: [12, 13] },
        tap: { fps: 6, loop: false, frames: [16, 17] }
      }
    };

    expect(manifest.spritesheet?.columns).toBe(4);
    expect(typeof manifest.animations.idle.frames[0]).toBe("number");
  });

  it("ships the default pet as a spritesheet manifest", () => {
    const manifestPath = path.join(process.cwd(), "public/pets/default/pet.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PetManifest;

    expect(manifest.id).toBe("default-pet");
    expect(manifest.spritesheet?.path).toBe("spritesheet.png");
    expect(manifest.spritesheet?.frameWidth).toBe(256);
    expect(manifest.animations.idle.frames).toEqual([0, 1, 2, 3]);
  });
});

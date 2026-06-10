import type { PetBrainInput, PetBrainResponse } from "../shared/types";

export interface PetBrain {
  respond(input: PetBrainInput): PetBrainResponse;
}

const tapMessages = [
  "我在这里。",
  "今天也一起待一会儿吧。",
  "摸摸收到。",
  "精神充电中。",
  "我会乖乖陪着你。"
];

const idleMessages = ["我先自己玩一会儿。", "有事叫我。", "桌面风景不错。"];
const sleepMessages = ["我有点困了。", "眯一会儿。", "充能中。"];

export class RuleBasedPetBrain implements PetBrain {
  respond(input: PetBrainInput): PetBrainResponse {
    const now = new Date().toISOString();

    if (input.event === "tap") {
      return {
        message: pick(tapMessages),
        animation: "tap",
        statePatch: {
          mood: clamp(input.state.mood + 6),
          energy: clamp(input.state.energy - 1),
          affinity: input.state.affinity + 1,
          lastInteractionAt: now
        }
      };
    }

    if (input.event === "feed") {
      return {
        message: "好吃，恢复一点精神。",
        animation: "happy",
        statePatch: {
          mood: clamp(input.state.mood + 4),
          energy: clamp(input.state.energy + 12),
          lastInteractionAt: now
        }
      };
    }

    if (input.event === "sleepTick" || input.state.energy < 25) {
      return {
        message: pick(sleepMessages),
        animation: "sleep",
        statePatch: {
          mood: clamp(input.state.mood - 1),
          energy: clamp(input.state.energy + 4)
        }
      };
    }

    if (input.event === "wake") {
      return {
        message: "醒啦。",
        animation: "happy",
        statePatch: {
          energy: clamp(input.state.energy + 5),
          lastInteractionAt: now
        }
      };
    }

    return {
      message: pick(idleMessages),
      animation: input.state.mood > 65 ? "walk" : "idle",
      statePatch: {
        mood: clamp(input.state.mood - 1),
        energy: clamp(input.state.energy - 2)
      }
    };
  }
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function pick(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)] ?? values[0];
}

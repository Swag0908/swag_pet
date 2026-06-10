import type { SwagPetApi } from "../shared/types";

declare global {
  interface Window {
    swagPet: SwagPetApi;
  }
}

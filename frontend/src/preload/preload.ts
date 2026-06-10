import { contextBridge, ipcRenderer } from "electron";
import type { PetState, Point, SwagPetApi } from "../shared/types";

const api: SwagPetApi = {
  getState: () => ipcRenderer.invoke("state:get") as Promise<PetState>,
  updateState: (patch: Partial<PetState>) => ipcRenderer.invoke("state:update", patch) as Promise<PetState>,
  resizeWindow: (state: PetState) => ipcRenderer.invoke("window:resize", state) as Promise<void>,
  dragStart: (screenPoint: Point) => ipcRenderer.invoke("window:drag-start", screenPoint) as Promise<void>,
  dragMove: (screenPoint: Point) => ipcRenderer.invoke("window:drag-move", screenPoint) as Promise<void>,
  dragEnd: () => ipcRenderer.invoke("window:drag-end") as Promise<PetState>,
  resetPosition: () => ipcRenderer.invoke("window:reset-position") as Promise<PetState>
};

contextBridge.exposeInMainWorld("swagPet", api);

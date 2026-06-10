import path from "node:path";
import { app, BrowserWindow, ipcMain, Menu, nativeImage, screen, Tray } from "electron";
import type { PetState, Point } from "../shared/types";
import { clampPetScale } from "../shared/scale";
import { StateStore } from "./stateStore";

const baseWindowSize = {
  width: 320,
  height: 330
};

const minWindowSize = {
  width: 340,
  height: 320
};

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let store: StateStore | null = null;
let dragStart: { pointer: Point; windowPosition: Point } | null = null;

function getDefaultWindowPosition(): Point {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: Math.round(workArea.x + workArea.width - baseWindowSize.width - 32),
    y: Math.round(workArea.y + workArea.height - baseWindowSize.height - 72)
  };
}

function getWindowSizeForState(state: PetState): { width: number; height: number } {
  const scale = clampPetScale(state.settings.petScale);
  const statusExtraHeight = state.settings.showStatusBar ? 34 : 0;

  return {
    width: Math.max(minWindowSize.width, Math.round(baseWindowSize.width * scale)),
    height: Math.max(minWindowSize.height, Math.round(baseWindowSize.height * scale + statusExtraHeight))
  };
}

function createWindow(): void {
  const defaultPosition = getDefaultWindowPosition();
  store = new StateStore(app.getPath("userData"), defaultPosition);
  const state = store.get();
  const windowSize = getWindowSizeForState(state);

  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    x: Math.round(state.position.x),
    y: Math.round(state.position.y),
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: state.settings.alwaysOnTop,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(state.settings.alwaysOnTop, "floating");

  mainWindow.on("moved", saveWindowPosition);
  mainWindow.on("close", () => {
    saveWindowPosition();
  });

  if (process.env.SWAG_PET_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.SWAG_PET_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist-renderer/index.html"));
  }
}

function resizeWindowForState(state: PetState): void {
  if (!mainWindow) {
    return;
  }

  const { width, height } = getWindowSizeForState(state);
  mainWindow.setSize(width, height, false);
  saveWindowPosition();
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect width="18" height="18" fill="none"/><path fill="#111827" d="M9 2h2v2h2v2h2v4h-2v2h-2v2H7v-2H5v-2H3V6h2V4h2V2h2z"/><path fill="#f59e0b" d="M7 7h2v2H7zm4 0h2v2h-2zM8 11h3v1H8z"/></svg>'
      )
  );

  tray = new Tray(icon);
  tray.setToolTip("Swag Pet");
  refreshTrayMenu();
}

function refreshTrayMenu(): void {
  if (!tray) {
    return;
  }

  const isVisible = mainWindow?.isVisible() ?? false;
  const menu = Menu.buildFromTemplate([
    {
      label: isVisible ? "隐藏宠物" : "显示宠物",
      click: () => {
        if (!mainWindow) {
          return;
        }
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.showInactive();
        }
        refreshTrayMenu();
      }
    },
    {
      label: "重置位置",
      click: () => {
        resetWindowPosition();
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
}

function saveWindowPosition(): void {
  if (!mainWindow || !store) {
    return;
  }
  const [x, y] = mainWindow.getPosition();
  store.update({ position: { x, y } });
}

function resetWindowPosition(): void {
  if (!mainWindow || !store) {
    return;
  }
  const position = getDefaultWindowPosition();
  mainWindow.setPosition(position.x, position.y);
  store.update({ position });
}

function registerIpc(): void {
  ipcMain.handle("state:get", () => store?.get());

  ipcMain.handle("state:update", (_event, patch) => {
    if (!store) {
      throw new Error("State store is not ready.");
    }
    const updatedState = store.update(patch);
    mainWindow?.setAlwaysOnTop(updatedState.settings.alwaysOnTop, "floating");
    resizeWindowForState(updatedState);
    return updatedState;
  });

  ipcMain.handle("window:resize", (_event, state: PetState) => {
    resizeWindowForState(state);
  });

  ipcMain.handle("window:drag-start", (_event, pointer: Point) => {
    if (!mainWindow) {
      return;
    }
    const [x, y] = mainWindow.getPosition();
    dragStart = {
      pointer,
      windowPosition: { x, y }
    };
  });

  ipcMain.handle("window:drag-move", (_event, pointer: Point) => {
    if (!mainWindow || !dragStart) {
      return;
    }
    const nextX = Math.round(dragStart.windowPosition.x + pointer.x - dragStart.pointer.x);
    const nextY = Math.round(dragStart.windowPosition.y + pointer.y - dragStart.pointer.y);
    mainWindow.setPosition(nextX, nextY);
  });

  ipcMain.handle("window:drag-end", () => {
    dragStart = null;
    saveWindowPosition();
    return store?.get();
  });

  ipcMain.handle("window:reset-position", () => {
    resetWindowPosition();
    return store?.get();
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Keep the tray app alive until the user chooses Quit.
});

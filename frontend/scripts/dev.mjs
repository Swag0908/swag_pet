import { spawn } from "node:child_process";
import http from "node:http";

const devServerUrl = "http://127.0.0.1:5173";
const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
  children.push(child);
  return child;
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tick, 300);
      });
    };

    tick();
  });
}

function cleanup() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

const build = run("npm", ["run", "build:main"]);

build.on("exit", async (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  run("npm", ["exec", "vite", "--", "--host", "127.0.0.1"]);

  try {
    await waitForServer(devServerUrl);
    const electron = run("npm", ["exec", "electron", "."], {
      env: {
        ...process.env,
        SWAG_PET_DEV_SERVER_URL: devServerUrl
      }
    });
    electron.on("exit", (exitCode) => {
      cleanup();
      process.exit(exitCode ?? 0);
    });
  } catch (error) {
    console.error(error);
    cleanup();
    process.exit(1);
  }
});

import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PythonBridgeService } from "../src/services/PythonBridgeService";
import { SaveReaderService } from "../src/services/SaveReaderService";
import { registerParserIpc } from "./ipc/parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null = null;

/**
 * Builds main-process services with constructor dependency injection.
 */
/**
 * Resolve the Python 3.13 executable using a priority-ordered discovery strategy.
 *
 * Priority:
 *   1. PYTHON_PATH environment variable (explicit override)
 *   2. `py -3.13`  — Windows py launcher with version pin
 *   3. `python3.13` — Linux / macOS convention
 *   4. `python`    — last resort; health check will reject wrong versions
 */
function resolvePythonExecutable(): string {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH;
  }
  if (process.platform === "win32") {
    return "py";
  }
  return "python3.13";
}

/**
 * Returns the argv prefix for the resolved executable.
 * `py` on Windows needs `-3.13` prepended to every invocation.
 */
export function getPythonArgs(scriptPath: string, commandArgs: string[]): string[] {
  const exe = resolvePythonExecutable();
  if (exe === "py") {
    return ["-3.13", scriptPath, ...commandArgs];
  }
  return [scriptPath, ...commandArgs];
}

function createServices(): {
  pythonBridge: PythonBridgeService;
  saveReaderService: SaveReaderService;
} {
  const appRoot = process.env.APP_ROOT ?? process.cwd();

  const pythonBridge = new PythonBridgeService({
    pythonExecutable: resolvePythonExecutable(),
    scriptPath: path.join(appRoot, "python", "main.py"),
    pythonArgs: resolvePythonExecutable() === "py" ? ["-3.13"] : [],
  });

  const saveReaderService = new SaveReaderService(pythonBridge);

  return { pythonBridge, saveReaderService };
}

function createWindow(): void {
  console.log("======== Electron ======== createWindow called");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Palworld Owned Pal Extractor",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    console.log("Loading URL from dev server:", VITE_DEV_SERVER_URL);
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(RENDERER_DIST, "index.html");
    console.log("Loading file from dist:", filePath);
    mainWindow.loadFile(filePath);
  }
  
  mainWindow.webContents.on("did-finish-load", () => {
    console.log("BrowserWindow finished loading");
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript("console.log('JavaScript execution test - page loaded successfully')");
    }
  });
  
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error("BrowserWindow failed to load:", errorCode, errorDescription);
  });
  
  mainWindow.webContents.on("did-start-loading", () => {
    console.log("BrowserWindow started loading");
  });
  
  mainWindow.webContents.on("did-stop-loading", () => {
    console.log("BrowserWindow stopped loading");
  });
}

app.whenReady().then(() => {
  console.log("========== APP START ==========");
  console.log("Electron ready");
  console.log("process.cwd():", process.cwd());
  console.log("process.argv:", process.argv);
  console.log("process.env.VITE_DEV_SERVER_URL:", process.env.VITE_DEV_SERVER_URL);
  console.log("process.env.APP_ROOT:", process.env.APP_ROOT);
  console.log("VITE_DEV_SERVER_URL:", VITE_DEV_SERVER_URL);
  console.log("MAIN_DIST:", MAIN_DIST);
  console.log("RENDERER_DIST:", RENDERER_DIST);
  console.log("__dirname:", __dirname);
  
  const { pythonBridge } = createServices();
  console.log("Services created");
  registerParserIpc(pythonBridge);
  console.log("IPC registered");

  // Folder selection dialog
  ipcMain.handle("dialog:select-folder", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Palworld Save Folder",
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  createWindow();
  console.log("BrowserWindow created");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  console.log("========== APP SHUTDOWN ==========");
  console.log("Window all closed");
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
    console.log("App quit");
  }
});

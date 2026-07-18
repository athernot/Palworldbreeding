import { ipcMain } from "electron";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import {
  IPC_PARSER_HEALTH,
  IPC_PARSER_DECODE_SAVE,
  IPC_PARSER_EXTRACT_SAVE,
} from "../../src/constants/ipc";
import type { PythonBridgeService } from "../../src/services/PythonBridgeService";
import type { PythonBridgeHealthResult } from "../../src/types/PythonBridgeHealthResult";
import type { DecodeSaveResult } from "../../src/types/DecodeSaveResult";

const userDataPath = app.getPath("userData");
const logFile = join(userDataPath, "extraction.log");

function log(message: string) {
  try {
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    appendFileSync(logFile, logMessage);
    console.log(message);
  } catch (error) {
    console.log(`Failed to log: ${error}`);
  }
}

/**
 * Registers parser-related IPC handlers in the Electron main process.
 * Delegates to PythonBridgeService — no parser implementation here.
 */
export function registerParserIpc(pythonBridge: PythonBridgeService): void {
  console.log("========== APP START ==========");
  console.log("IPC registration starting");
  log("registerParserIpc called");
  
  ipcMain.handle(IPC_PARSER_HEALTH, async (): Promise<PythonBridgeHealthResult> => {
    log("IPC_PARSER_HEALTH called");
    const pythonAvailable = await pythonBridge.checkPython();
    log(`Python available: ${pythonAvailable}`);

    if (!pythonAvailable) {
      log("Python not available, returning error");
      return {
        success: false,
        message: "Python executable was not found.",
      };
    }

    const result = await pythonBridge.executeJson<PythonBridgeHealthResult>();
    log(`Health check result: ${JSON.stringify(result)}`);
    return result;
  });

  ipcMain.handle(
    IPC_PARSER_DECODE_SAVE,
    async (_event, savePath: string): Promise<DecodeSaveResult> => {
      log(`IPC_PARSER_DECODE_SAVE called with path: ${savePath}`);
      return pythonBridge.decodeSave(savePath);
    },
  );

  ipcMain.handle(
    IPC_PARSER_EXTRACT_SAVE,
    async (_event, savePath: string): Promise<DecodeSaveResult> => {
      log(`======== IPC ======== IPC_PARSER_EXTRACT_SAVE called with path: ${savePath}`);
      const result = await pythonBridge.extractSave(savePath);
      log(`======== IPC ======== IPC_PARSER_EXTRACT_SAVE result: success=${result.success}, data keys=${result.success ? Object.keys(result.data).join(",") : "N/A"}`);
      log(`======== IPC ======== IPC_PARSER_EXTRACT_SAVE returning result...`);
      return result;
    },
  );

  ipcMain.handle("log-message", async (_event, message: string) => {
    log(`[Renderer] ${message}`);
    return { success: true };
  });
  
  console.log("IPC registration completed");
}

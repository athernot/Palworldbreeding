import { contextBridge, ipcRenderer } from "electron";
import {
  IPC_PARSER_HEALTH,
  IPC_PARSER_DECODE_SAVE,
  IPC_PARSER_EXTRACT_SAVE,
} from "../src/constants/ipc";
import type { PythonBridgeHealthResult } from "../src/types/PythonBridgeHealthResult";
import type { DecodeSaveResult } from "../src/types/DecodeSaveResult";

/**
 * Secure bridge exposed to the renderer.
 * Renderer may invoke IPC channels only — never Node or Python APIs.
 */
console.log("========== APP START ==========");
console.log("Preload script loading");
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  invokeParserHealth: (): Promise<PythonBridgeHealthResult> =>
    ipcRenderer.invoke(IPC_PARSER_HEALTH),
  invokeDecodeSave: (savePath: string): Promise<DecodeSaveResult> =>
    ipcRenderer.invoke(IPC_PARSER_DECODE_SAVE, savePath),
  invokeExtractSave: (savePath: string): Promise<DecodeSaveResult> => {
    console.log("======== Preload ======== invokeExtractSave called with path:", savePath);
    return ipcRenderer.invoke(IPC_PARSER_EXTRACT_SAVE, savePath);
  },
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:select-folder"),
  logMessage: (message: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke("log-message", message),
});
console.log("Preload loaded");

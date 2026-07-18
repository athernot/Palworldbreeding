import {
  IPC_PARSER_HEALTH,
  IPC_PARSER_DECODE_SAVE,
  IPC_PARSER_EXTRACT_SAVE,
} from "@/constants/ipc";
import type { PythonBridgeHealthResult } from "@/types/PythonBridgeHealthResult";
import type { DecodeSaveResult } from "@/types/DecodeSaveResult";

/**
 * Renderer-side IPC client for parser bridge channels.
 * Talks to Electron main only — never touches Python directly.
 */
export async function checkParserHealth(): Promise<PythonBridgeHealthResult> {
  return window.electronAPI.invokeParserHealth();
}

/**
 * Sends a save folder path to the Python adapter and returns decoded JSON.
 */
export async function decodeSave(savePath: string): Promise<DecodeSaveResult> {
  return window.electronAPI.invokeDecodeSave(savePath);
}

/**
 * Decodes the save folder, then extracts owned pal list.
 */
export async function extractSave(savePath: string): Promise<DecodeSaveResult> {
  const result = await window.electronAPI.invokeExtractSave(savePath);
  return result;
}

export { IPC_PARSER_HEALTH, IPC_PARSER_DECODE_SAVE, IPC_PARSER_EXTRACT_SAVE };

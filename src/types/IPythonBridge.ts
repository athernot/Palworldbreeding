import type { DecodeSaveResult } from "./DecodeSaveResult";

/**
 * Contract for spawning and communicating with the external Python adapter.
 * Implementations live in the infrastructure layer (Node main process only).
 */
export interface IPythonBridge {
  start(): Promise<void>;
  checkPython(): Promise<boolean>;
  execute(args?: readonly string[]): Promise<string>;
  executeJson<T>(args?: readonly string[]): Promise<T>;
  decodeSave(savePath: string): Promise<DecodeSaveResult>;
}

import type { IPythonBridge } from "@/types/IPythonBridge";

/**
 * Application service that orchestrates read-only save access.
 * Depends on IPythonBridge via constructor injection.
 */
export class SaveReaderService {
  private readonly pythonBridge: IPythonBridge;

  constructor(pythonBridge: IPythonBridge) {
    this.pythonBridge = pythonBridge;
  }

  /**
   * Reads and decodes a Palworld save folder.
   * Returns the raw decoded JSON data on success, or throws on error.
   */
  async read(path: string): Promise<unknown> {
    const result = await this.pythonBridge.decodeSave(path);

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }
}

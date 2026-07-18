/// <reference types="vite/client" />

import type { DecodeSaveResult } from "./types/DecodeSaveResult";

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      invokeParserHealth: () => Promise<{
        success: boolean;
        message: string;
      }>;
      invokeDecodeSave: (savePath: string) => Promise<DecodeSaveResult>;
      invokeExtractSave: (savePath: string) => Promise<DecodeSaveResult>;
      selectFolder: () => Promise<string | null>;
      logMessage: (message: string) => Promise<{ success: boolean }>;
    };
  }
}

export {};

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { IPythonBridge } from "@/types/IPythonBridge";
import type { DecodeSaveResult } from "@/types/DecodeSaveResult";

const userDataPath = app.getPath("userData");
const logFile = join(userDataPath, "extraction.log");

function log(message: string) {
  try {
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [PythonBridge] ${message}\n`;
    appendFileSync(logFile, logMessage);
    console.log(`[PythonBridge] ${message}`);
  } catch (error) {
    console.log(`Failed to log: ${error}`);
  }
}

export type PythonBridgeServiceOptions = {
  pythonExecutable: string;
  scriptPath: string;
  /** Optional args prepended before the script path (e.g. ["-3.13"] for py launcher). */
  pythonArgs?: string[];
};

/**
 * Infrastructure service that spawns the external Python adapter process.
 * Contains no save-reading or decoding logic.
 */
export class PythonBridgeService implements IPythonBridge {
  private readonly pythonExecutable: string;
  private readonly scriptPath: string;
  private readonly pythonArgs: string[];
  private started = false;

  constructor(options: PythonBridgeServiceOptions) {
    this.pythonExecutable = options.pythonExecutable;
    this.scriptPath = options.scriptPath;
    this.pythonArgs = options.pythonArgs ?? [];
  }

  /**
   * Marks the bridge as ready after validating the adapter script exists.
   */
  async start(): Promise<void> {
    log(`start() called, scriptPath: ${this.scriptPath}`);
    await fs.access(this.scriptPath);
    this.started = true;
    log("start() completed successfully");
  }

  /**
   * Verifies that a Python executable is available on the host.
   */
  async checkPython(): Promise<boolean> {
    log(`checkPython() called with executable: ${this.pythonExecutable}`);
    try {
      await this.runProcess(this.pythonExecutable, [...this.pythonArgs, "--version"]);
      log("checkPython() succeeded");
      return true;
    } catch (error) {
      log(`checkPython() failed: ${error}`);
      return false;
    }
  }

  /**
   * Executes the Python adapter and returns raw stdout text.
   */
  async execute(args: readonly string[] = []): Promise<string> {
    log(`execute() called with args: ${args.join(", ")}`);
    if (!this.started) {
      log("Bridge not started, calling start()");
      await this.start();
    }

    const result = await this.runProcess(this.pythonExecutable, [...this.pythonArgs, this.scriptPath, ...args]);
    log(`execute() completed, output length: ${result.length}`);
    return result;
  }

  /**
   * Executes the Python adapter and parses stdout as JSON.
   */
  async executeJson<T>(args: readonly string[] = []): Promise<T> {
    log(`executeJson() called with args: ${args.join(", ")}`);
    const stdout = await this.execute(args);
    log(`executeJson() parsing JSON from stdout`);
    const result = JSON.parse(stdout) as T;
    log(`executeJson() completed successfully`);
    return result;
  }

  /**
   * Decodes a Palworld save folder and returns the raw JSON result.
   */
  async decodeSave(savePath: string): Promise<DecodeSaveResult> {
    log(`decodeSave() called with path: ${savePath}`);
    return this.executeJson<DecodeSaveResult>(["decode_save", savePath]);
  }

  /**
   * Decodes the save folder, then runs the owned pal extractor.
   */
  async extractSave(savePath: string): Promise<DecodeSaveResult> {
    log(`extractSave() called with path: ${savePath}`);
    const result = await this.executeJson<DecodeSaveResult>(["extract_save", savePath]);
    log(`extractSave() completed: success=${result.success}, data keys=${result.success ? Object.keys(result.data).join(",") : "N/A"}`);
    return result;
  }

  private runProcess(command: string, args: readonly string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      log(`======== PythonBridge ======== runProcess called: command=${command}, args=${args.join(" ")}`);
      const child = spawn(command, [...args], {
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      child.on("error", (error) => {
        log(`======== PythonBridge ======== Process error: ${error}`);
        reject(error);
      });

      child.on("close", (code) => {
        log(`======== PythonBridge ======== Process closed with code: ${code}`);
        log(`======== PythonBridge ======== stdout length: ${stdout.length}`);
        log(`======== PythonBridge ======== stderr: ${stderr ? stderr : "(empty)"}`);
        if (code !== 0) {
          reject(
            new Error(
              stderr.trim() || `Process "${command}" exited with code ${code ?? "unknown"}`,
            ),
          );
          return;
        }

        resolve(stdout.trim());
      });
    });
  }
}

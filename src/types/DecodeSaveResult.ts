/**
 * JSON payload returned by the Python adapter decode_save command.
 */
export type DecodeSaveResult =
  | {
      success: true;
      data: Record<string, unknown>;
    }
  | {
      success: false;
      error: string;
    };
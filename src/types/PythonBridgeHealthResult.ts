/**
 * JSON payload returned by the Python adapter health check.
 */
export type PythonBridgeHealthResult = {
  success: boolean;
  message: string;
};

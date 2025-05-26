import axios from "axios";

/**
 * Safely extracts relevant information from error objects for logging
 * without circular references
 */
export const extractErrorInfo = (error: any): object => {
  if (!error) return { message: "Unknown error" };

  const errorInfo: Record<string, any> = {};

  // Include basic error properties
  if (error.message) errorInfo.message = error.message;
  if (error.name) errorInfo.name = error.name;
  if (error.code) errorInfo.code = error.code;

  // For Axios errors, extract relevant data without circular references
  if (axios.isAxiosError(error)) {
    errorInfo.isAxiosError = true;

    if (error.response) {
      errorInfo.status = error.response.status;
      errorInfo.statusText = error.response.statusText;
      errorInfo.data = error.response.data;
    }

    if (error.config) {
      errorInfo.url = error.config.url;
      errorInfo.method = error.config.method;
      // Don't include config.headers as it might contain sensitive data
    }
  }

  return errorInfo;
};

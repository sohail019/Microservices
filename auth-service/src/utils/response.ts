/**
 * Standard success response
 */
export const successResponse = (data: any, message?: string) => {
  return {
    success: true,
    message: message || "Operation completed successfully",
    data,
  };
};

/**
 * Standard error response
 */
export const errorResponse = (
  message: string,
  code?: string,
  details?: any
) => {
  return {
    success: false,
    error: {
      message,
      code,
      details: details || undefined,
    },
  };
};

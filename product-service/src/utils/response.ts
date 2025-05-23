/**
 * Generate a standardized success response
 */
export const successResponse = (data: any, message?: string) => {
  return {
    success: true,
    message,
    data,
  };
};

/**
 * Generate a standardized error response
 */
export const errorResponse = (message: string, errors?: any) => {
  return {
    success: false,
    error: {
      message,
      details: errors,
    },
  };
};

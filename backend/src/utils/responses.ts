import { AppError } from "./error";

export type AppResponse<T> = {
  success: boolean;
  data?: T;
  errors: string[];
};

export function SuccessResponse<T>(data?: T): AppResponse<T> {
  return { success: true, data, errors: [] };
}

export function ErrorResponse<T = never>(errors: string[]): AppResponse<T> {
  return { success: false, errors };
}

export function errToResponse<T = unknown>(err: AppError): AppResponse<T> {
  const message = err.isOperational ? err.message : "Internal server error";

  return {
    success: false,
    errors: [`${err.code}: ${message}`],
  };
}

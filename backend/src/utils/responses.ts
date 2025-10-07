export type AppResponse<T> = {
  success: boolean;
  data?: T;
  errors: string[];
};

export function SuccessResponse<T>(data: T): AppResponse<T> {
  return { success: true, data, errors: [] };
}

export function ErrorResponse<T>(errors: string[]): AppResponse<T> {
  return { success: false, errors };
}

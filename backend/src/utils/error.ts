export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      code?: string;
      isOperational?: boolean;
      details?: Record<string, unknown>;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = this.constructor.name;

    this.isOperational = options?.isOperational ?? true;
    this.code = options?.code ?? "INTERNAL_ERROR";
    this.details = options?.details;

    if (options?.cause) this.cause = options.cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

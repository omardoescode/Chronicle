import { AppError } from "@/utils/error";

export class ApiNotFound extends AppError {
  constructor() {
    super("Invalid Api", { isOperational: true, code: "INVALID_API" });
  }
}

export class ApiGenerationAfterAttempts extends AppError {
  constructor(attempts: number) {
    super(`Failed to generate an API key after ${attempts} attempts`, {
      isOperational: true,
      code: "API_GENERATION_FAILED",
    });
  }
}

export class ApiMetadataAlreadySet extends AppError {
  constructor() {
    super("Metadata already set for this API key", { code: "METADATA_EXISTS" });
  }
}

export class ApiMetadataNotSet extends AppError {
  constructor() {
    super("Metadata are not set for this API key", {
      code: "METADATA_NO_EXISTS",
    });
  }
}

export class InvalidApi extends AppError {
  constructor() {
    super("Invalid API", {
      code: "INVALID_API",
    });
  }
}

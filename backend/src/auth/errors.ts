import { AppError } from "@/utils/error";

export class UserNotFound extends AppError {
  constructor(email: string) {
    super(`User with email ${email} not found`, {
      code: "USER_NOT_FOUND",
      isOperational: true,
    });
  }
}

export class InvalidPassword extends AppError {
  constructor() {
    super(`Invalid Password`, {
      code: "INVALID_PASSWORD",
      isOperational: true,
    });
  }
}

export class EmailExists extends AppError {
  constructor(email: string) {
    super(`Email already exists: ${email}`, {
      code: "NON_UNIQUE_EMAIL",
      isOperational: true,
    });
  }
}

export class UnauthorizedUser extends AppError {
  constructor() {
    super(`Unauthroized User`, {
      code: "UNAUTHROIZED",
      isOperational: true,
    });
  }
}

export class InvalidToken extends AppError {
  constructor() {
    super(`Invalid Token`, {
      code: "InvalidToken",
      isOperational: true,
    });
  }
}

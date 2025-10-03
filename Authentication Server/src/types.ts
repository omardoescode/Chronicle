export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  passwordHash: string;
  failedAttempts?: number;
}

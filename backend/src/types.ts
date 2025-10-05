export interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash?: string;
  timezone: number;
  is_deleted: boolean;
}

export interface LoginInput {
  identifier: string;  // Could be email, userId, or name
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
export interface User {
  user_id: number;
  name: string;
  email: string;
}

export interface UserWithPasswordHash extends User {
  password_hash: string;
}

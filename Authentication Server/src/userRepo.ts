import { User } from './types';

const users = new Map<string, User>();
let idCounter = 1;

export const createUser = (email: string, name: string | undefined, phone: string | undefined, passwordHash: string): User => {
  const id = String(idCounter++);
  const user: User = { id, email, name: name ?? null, phone: phone ?? null, passwordHash, failedAttempts: 0 };
  users.set(id, user);
  return user;
};

export const findUserByEmail = (email: string): User | undefined => {
  for (const u of users.values()) {
    if (u.email === email) return u;
  }
  return undefined;
};

export const findUserByName = (name: string): User | undefined => {
  for (const u of users.values()) {
    if (u.name === name) return u;
  }
  return undefined;
};

export const findUserByPhone = (phone: string): User | undefined => {
  for (const u of users.values()) {
    if (u.phone === phone) return u;
  }
  return undefined;
};

export const findUserById = (id: string): User | undefined => users.get(id);

export const listUsers = (): User[] => Array.from(users.values());

export const getAllUsers = (): Omit<User, 'passwordHash'>[] => {
  return Array.from(users.values()).map(({ passwordHash, ...rest }) => rest);
};

export const incrementFailedAttempts = (id: string): number => {
  const user = users.get(id);
  if (!user) return 0;
  user.failedAttempts = (user.failedAttempts ?? 0) + 1;
  users.set(id, user);
  return user.failedAttempts;
};

export const resetFailedAttempts = (id: string): void => {
  const user = users.get(id);
  if (!user) return;
  user.failedAttempts = 0;
  users.set(id, user);
};

export const deleteUser = (id: string): boolean => {
  return users.delete(id);
};


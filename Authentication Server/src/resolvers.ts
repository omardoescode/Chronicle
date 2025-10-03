import { IResolvers } from '@graphql-tools/utils';
import * as bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserByName, findUserByPhone, listUsers, getAllUsers, incrementFailedAttempts, resetFailedAttempts, deleteUser } from './userRepo';
import { signToken } from './auth';

const resolvers: IResolvers = {
  Query: {
    me: (_parent, _args, context) => {
      if (!context.user) return null;
      return context.user;
    },
    users: () => {
      return getAllUsers();
    },
  },
  Mutation: {
    signup: async (_parent, { email, password, name, phone }) => {
      const existingByEmail = findUserByEmail(email);
      if (existingByEmail) throw new Error('Email already in use');
      if (phone) {
        const existingByPhone = findUserByPhone(phone);
        if (existingByPhone) throw new Error('Phone already in use');
      }
      const hash = await bcrypt.hash(password, 10);
      const user = createUser(email, name, phone, hash);
      const token = signToken(user.id);
      return { token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } };
    },
    login: async (_parent, { identifier, password }) => {
      let user = findUserByEmail(identifier) || findUserByName(identifier) || findUserByPhone(identifier);
      if (!user) throw new Error('Invalid credentials');
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        const attempts = incrementFailedAttempts(user.id);
        if (attempts >= 10) {
          deleteUser(user.id);
          throw new Error('Account deleted after 10 failed attempts');
        }
        throw new Error('Invalid credentials');
      }
      resetFailedAttempts(user.id);
      const token = signToken(user.id);
      return { token, user: { id: user.id, email: user.email, name: user.name, phone: user.phone } };
    },
  },
  User: {
    id: (parent) => parent.id,
    email: (parent) => parent.email,
    name: (parent) => parent.name,
    phone: (parent) => parent.phone,
    failedAttempts: (parent) => parent.failedAttempts ?? 0,
  },
  AuthPayload: {
    id: (parent) => parent.user?.id,
    email: (parent) => parent.user?.email,
    name: (parent) => parent.user?.name,
    phone: (parent) => parent.user?.phone,
  },
};

export default resolvers;

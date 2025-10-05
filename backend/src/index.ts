import { app } from "@getcronit/pylon";
import init from "./init";
import { signup, login, getCurrentUser } from "./service/auth";
import { getAllUsers } from "./db/auth";

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  timezone: number;
}

export interface LoginInput {
  identifier: string;  // Could be email, userId, or name
  password: string;
}

await init()
  .then(() => {
    console.log("Initialize the database");
  })
  .catch((err) => {
    console.error("Failed to initialize the database");
    console.error(`Error: ${err}`);
    process.exit(1);
  });

export const graphql = {
  Query: {
    me: async (_, __, { headers }) => {
      const token = headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Authentication required');
      return await getCurrentUser(token);
    },
    users: async (_, __, { headers }) => {
      const token = headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('Authentication required');
      await getCurrentUser(token);
      return await getAllUsers();
    }
  },
  Mutation: {
    signup: async (_, { input }) => {
      const { name, email, password, timezone } = input;
      return await signup(name, email, password, timezone);
    },
    login: async (_, { input }) => {
      const { identifier, password } = input;
      return await login(identifier, password);
    }
  },
};

export default app;

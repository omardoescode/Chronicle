import { app, getContext } from "@getcronit/pylon";
import init from "./init";
import { login } from "./service/auth";
import { ErrorResponse, SuccessResponse } from "./utils/responses";

await init()
  .then(() => {
    console.log("The database has been initialized");
  })
  .catch((err) => {
    console.error("Failed to initialize the database");
    console.error(`Error: ${err}`);
    process.exit(1);
  });

export const graphql = {
  Query: {
    hello: () => "world",
  },
  Mutation: {
    async login(email: string, password: string) {
      const token = await login(email, password);
      if (token) return SuccessResponse(token);
      return ErrorResponse(["Invalid credentials. Check email or password"]);
    },
  },
};

export default app;

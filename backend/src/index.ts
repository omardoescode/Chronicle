import { app } from "@getcronit/pylon";
import init from "./init";
import { login, register } from "./service/auth";
import { AppResponse, ErrorResponse, SuccessResponse } from "./utils/responses";
import { validateTimezone } from "./utils/validation";
import { type User } from "./validation/auth";
import { authorized } from "./middleware/auth";

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
    hello: authorized(async (user) => SuccessResponse(user)),
  },
  Mutation: {
    async login(
      email: string,
      password: string
    ): Promise<AppResponse<{ token: string; user: User }>> {
      const data = await login(email, password);
      if (data instanceof Error) return ErrorResponse([data.message]);
      return SuccessResponse(data);
    },

    async register(
      name: string,
      email: string,
      password: string,
      timezone: number
    ): Promise<AppResponse<{ token: string; user: User }>> {
      const timezoneError = validateTimezone(timezone);
      if (timezoneError) return ErrorResponse([timezoneError]);

      const data = await register({
        name,
        email,
        password,
        timezone,
      });

      if (data instanceof Error) return ErrorResponse([data.message]);
      return SuccessResponse(data);
    },
  },
};

export default app;

import { app, getContext } from "@getcronit/pylon";
import init from "./init";
import { login, register } from "./service/auth";
import { AppResponse, ErrorResponse, SuccessResponse } from "./utils/responses";
import { validateTimezone } from "./utils/validation";
import { User } from "./types/auth";

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
    async login(
      email: string,
      password: string,
      test?: string
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

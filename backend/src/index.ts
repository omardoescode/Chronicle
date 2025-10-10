import { app } from "@getcronit/pylon";
import * as auth from "@/auth/service";
import * as api from "@/api/service";
import { AppResponse, ErrorResponse, SuccessResponse } from "./utils/responses";
import { validateTimezone } from "./utils/validation";
import { type User } from "./auth/validation";
import { authorized } from "./auth/middleware";

export const graphql = {
  Query: {
    hello: authorized(async (user) => SuccessResponse({ ...user })),
  },
  Mutation: {
    async login(
      email: string,
      password: string
    ): Promise<AppResponse<{ token: string; user: User }>> {
      const data = await auth.login(email, password);
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

      const data = await auth.register({
        name,
        email,
        password,
        timezone,
      });

      if (data instanceof Error) return ErrorResponse([data.message]);
      return SuccessResponse(data);
    },
    generateApiKey: authorized(
      async (user): Promise<AppResponse<{ api_key: string }>> => {
        const api_key = await api.generateApiKey(user.user_id);
        if (api_key instanceof Error) return ErrorResponse([api_key.message]);
        return SuccessResponse({ api_key });
      }
    ),
  },
};

export default app;

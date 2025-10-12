import { UnauthorizedUser } from "@/auth/errors";
import { User } from "@/auth/validation";
import { AppResponse, errToResponse } from "@/utils/responses";
import { getContext } from "@getcronit/pylon";
import { ApiKey, ApiKeySchema } from "./validation";
import { getUserByApi } from "./db";
import { ApiNotFound } from "./errors";
import { AppError } from "@/utils/error";

export function withApi<TArgs extends unknown[], TReturn>(
  fn: (user: User, api: ApiKey, ...args: TArgs) => Promise<AppResponse<TReturn>>
): (...args: TArgs) => Promise<AppResponse<TReturn>> {
  return async (...args: TArgs): Promise<AppResponse<TReturn>> => {
    const ctx = getContext();
    const payload = ctx.req.header("Chronicle-Api-Key");
    if (!payload) return errToResponse(new UnauthorizedUser());
    const parsed = ApiKeySchema.safeParse(payload);
    if (parsed.error) return errToResponse(new ApiNotFound());
    const user = await getUserByApi(parsed.data);
    if (user instanceof AppError) return errToResponse(user);

    return await fn(user, parsed.data, ...args);
  };
}

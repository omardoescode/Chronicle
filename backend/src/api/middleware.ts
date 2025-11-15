import { UnauthorizedUser } from "@/auth/errors";
import { User } from "@/auth/validation";
import { AppResponse, errToResponse } from "@/utils/responses";
import { getContext } from "@getcronit/pylon";
import { ApiKey, ApiKeySchema } from "./validation";
import { getUserByApi } from "./db";
import { AppError, InternalServerError } from "@/utils/error";
import { InvalidApi } from "./errors";
import pool from "@/pool";

export function withApi<TArgs extends unknown[], TReturn>(
  fn: (user: User, api: ApiKey, ...args: TArgs) => Promise<AppResponse<TReturn>>
): (...args: TArgs) => Promise<AppResponse<TReturn>> {
  return async (...args: TArgs): Promise<AppResponse<TReturn>> => {
    const ctx = getContext();
    const payload = ctx.req.header("Chronicle-Api-Key");
    if (!payload) return errToResponse(new UnauthorizedUser());
    const parsed = ApiKeySchema.safeParse(payload);
    if (parsed.error) return errToResponse(new InvalidApi());

    const client = await pool.connect();
    // TODO: Handle this for failure
    const user = await getUserByApi(client, parsed.data);
    client.release();
    if (user instanceof AppError) return errToResponse(user); // NOTE: ! this doens't feel right?

    try {
      return await fn(user, parsed.data, ...args);
    } catch (err) {
      console.error(err);
      return errToResponse(new InternalServerError());
    }
  };
}

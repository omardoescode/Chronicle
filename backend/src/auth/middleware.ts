import { verifyToken } from "@/utils/jwt";
import { AppResponse, errToResponse } from "@/utils/responses";
import { User, UserSchema } from "./validation";
import { getContext } from "@getcronit/pylon";
import { InvalidToken, UnauthorizedUser } from "./errors";

type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;

export function authorized<T>(
  fn: (user: User, ...args) => Promise<AppResponse<T>>
) {
  return async (
    ...args: Tail<Parameters<typeof fn>>
  ): Promise<ReturnType<typeof fn>> => {
    const ctx = getContext();
    const authorization = ctx.req.header("Authorization");
    if (!authorization) return errToResponse(new UnauthorizedUser());

    const sliced = authorization.split(" ");
    if (sliced.length !== 2 || sliced[0] !== "Bearer")
      return errToResponse(new UnauthorizedUser());

    const token = sliced[1];
    try {
      const payload = await verifyToken(token);
      const data = UserSchema.parse(payload);
      // Spread user into original fn
      return await fn(data, ...args);
    } catch (_) {
      return errToResponse(new InvalidToken());
    }
  };
}

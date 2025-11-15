import { verifyToken } from "@/utils/jwt";
import { AppResponse, errToResponse } from "@/utils/responses";
import { User, UserSchema } from "./validation";
import { getContext } from "@getcronit/pylon";
import { InvalidToken, UnauthorizedUser } from "./errors";
import { InternalServerError } from "@/utils/error";

export function authorized<TArgs extends unknown[], TReturn>(
  fn: (user: User, ...args: TArgs) => Promise<AppResponse<TReturn>>
): (...args: TArgs) => Promise<AppResponse<TReturn>> {
  return async (...args: TArgs): Promise<AppResponse<TReturn>> => {
    const ctx = getContext();
    const authorization = ctx.req.header("Authorization");
    if (!authorization) return errToResponse(new UnauthorizedUser());

    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token)
      return errToResponse(new UnauthorizedUser());

    let user: User;
    try {
      const payload = await verifyToken(token);
      user = UserSchema.parse(payload);
    } catch (_err) {
      console.log(_err);
      return errToResponse(new InvalidToken());
    }

    try {
      return await fn(user, ...args);
    } catch (err) {
      console.error(err);
      return errToResponse(new InternalServerError());
    }
  };
}

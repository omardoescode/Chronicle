import { verifyToken } from "@/utils/jwt";
import { AppResponse, ErrorResponse } from "@/utils/responses";
import { User, UserSchema } from "./validation";
import { getContext } from "@getcronit/pylon";

export const authorized =
  <T, Args extends any[]>(
    fn: (user: User, ...args: Args) => Promise<AppResponse<T>>
  ): ((...args: Args) => Promise<AppResponse<T>>) =>
  async (...args: Args) => {
    const ctx = getContext();
    const authorization = ctx.req.header("Authorization");
    if (!authorization) return ErrorResponse(["Unauthorized User"]);
    const sliced = authorization.split(" ");
    if (sliced.length != 2)
      return ErrorResponse(["Invalid authorization token"]);
    if (sliced[0] != "Bearer")
      return ErrorResponse(["Invalid Bearer Authentication"]);
    const token = sliced[1];
    try {
      const payload = await verifyToken(token);
      const data = UserSchema.parse(payload);
      return await fn(data, ...args);
    } catch (_err) {
      return ErrorResponse(["Invalid token or unverified one"]);
    }
  };

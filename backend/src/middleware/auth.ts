import { verifyToken } from "@/utils/jwt";
import { AppResponse, ErrorResponse } from "@/utils/responses";
import { UserSchema } from "@/validation/auth";
import { getContext } from "@getcronit/pylon";

export const authorized =
  <T>(
    fn: (user: User, ...args) => Promise<AppResponse<T>>
  ): ((...args) => Promise<AppResponse<T>>) =>
  async (...args) => {
    const ctx = getContext();
    const authorization = ctx.req.header("Authorization");
    if (!authorization) return ErrorResponse(["Unauthorized User"]);
    const sliced = authorization.split(" ");
    if (sliced.length != 2)
      return ErrorResponse(["Invalid authroization token"]);
    if (sliced[0] != "Bearer")
      return ErrorResponse(["Invalid Bearer Authentication"]);

    const token = sliced[1];
    try {
      const payload = await verifyToken(token);
      const data = UserSchema.parse(payload);
      return await fn(data, ...args);
    } catch (err) {
      return ErrorResponse(["Invalid token or unverfied one"]);
    }
  };

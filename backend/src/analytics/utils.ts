import { NormalizedUserSession, UserSession } from "./types";

export const normalizeSession = <T>(
  session: UserSession<T>
): NormalizedUserSession<T> => ({
  ...session,
  window_start: session.window_start.toISOString(),
  window_end: session.window_end.toISOString(),
});

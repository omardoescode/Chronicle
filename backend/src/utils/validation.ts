export function validateTimezone(timezone: number): string {
  if (timezone > 14 || timezone < -12)
    return "A timezone must be between -12 and 14";
  if (!Number.isInteger(timezone)) return "A timezone must be an integer";
  return "";
}

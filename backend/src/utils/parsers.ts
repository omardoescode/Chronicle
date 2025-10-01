export const toNumber = (val: string, error?: string) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) throw new Error(error ?? "Cannot parse to an integer");
  return parsed;
};

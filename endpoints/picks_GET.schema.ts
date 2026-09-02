import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({ seat: z.enum(["a", "b"]).optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { a: string[]; b: string[] };

export const getPicks = async (params: InputType = {}, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/picks`, { method: "GET", ...init, headers: { ...(init?.headers ?? {}) } });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

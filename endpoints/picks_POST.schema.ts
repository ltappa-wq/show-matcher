import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  seat: z.enum(["a", "b"]),
  titleId: z.string().min(1),
  picked: z.boolean(),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { a: string[]; b: string[] };

export const postPicks = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/picks`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

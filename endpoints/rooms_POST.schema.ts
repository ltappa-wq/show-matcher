import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  displayName: z.string().trim().min(1).max(40),
});
export type InputType = z.infer<typeof schema>;
export type OutputType = { roomId: string; code: string; name: string; memberId: string; displayName: string };

export const postRooms = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/rooms`, {
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

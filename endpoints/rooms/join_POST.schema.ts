import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  code: z.string().trim().min(4).max(12),
  displayName: z.string().trim().min(1).max(40),
  memberId: z.string().min(8).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  roomId: string;
  code: string;
  name: string;
  memberId: string;
  displayName: string;
};

export const postRoomsJoin = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/rooms/join`, {
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

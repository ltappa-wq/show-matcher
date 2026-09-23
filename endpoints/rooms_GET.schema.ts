import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  code: z.string().trim().min(4),
});

export type InputType = z.infer<typeof schema>;

export type RoomMember = { id: string; displayName: string };
export type RoomPick = { memberId: string; titleId: string };

export type OutputType = {
  roomId: string;
  code: string;
  name: string;
  members: RoomMember[];
  picks: RoomPick[];
};

export const getRooms = async (params: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(params);
  const search = new URLSearchParams({ code: validated.code });
  const result = await fetch(`/_api/rooms?${search.toString()}`, {
    method: "GET",
    ...init,
    headers: { ...(init?.headers ?? {}) },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

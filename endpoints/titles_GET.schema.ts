import { z } from "zod";
import superjson from "superjson";
import type { TitleCard } from "../helpers/titleTypes";

export const schema = z.object({ q: z.string().optional() });
export type InputType = z.infer<typeof schema>;
export type OutputType = { titles: TitleCard[]; source: "database" | "catalog"; warning: string | null };

export const getTitles = async (params: InputType = {}, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(params);
  const search = new URLSearchParams();
  if (validated.q) search.set("q", validated.q);
  const qs = search.toString();
  const result = await fetch(`/_api/titles${qs ? `?${qs}` : ""}`, { method: "GET", ...init, headers: { ...(init?.headers ?? {}) } });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};

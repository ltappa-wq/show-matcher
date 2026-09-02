import superjson from "superjson";
import { schema, OutputType } from "./picks_GET.schema";
import { db } from "../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = schema.parse({ roomId: url.searchParams.get("roomId") ?? "" });
    const room = await db.selectFrom("rooms").select("id").where("id", "=", input.roomId).executeTakeFirst();
    if (!room) {
      return new Response(superjson.stringify({ error: "Room not found." }), { status: 404 });
    }
    const members = await db.selectFrom("roomMembers").select(["id", "displayName"]).where("roomId", "=", input.roomId).orderBy("createdAt", "asc").execute();
    const picks = await db.selectFrom("roomPicks").select(["memberId", "titleId"]).where("roomId", "=", input.roomId).execute();
    return new Response(superjson.stringify({ members, picks } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load picks";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

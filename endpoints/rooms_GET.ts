import superjson from "superjson";
import { schema, OutputType } from "./rooms_GET.schema";
import { db } from "../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = schema.parse({ code: url.searchParams.get("code") ?? "" });
    const code = input.code.trim().toUpperCase();
    const room = await db.selectFrom("rooms").selectAll().where("code", "=", code).executeTakeFirst();
    if (!room) {
      return new Response(superjson.stringify({ error: "No room with that code." }), { status: 404 });
    }
    const members = await db.selectFrom("roomMembers").select(["id", "displayName"]).where("roomId", "=", room.id).orderBy("createdAt", "asc").execute();
    const picks = await db.selectFrom("roomPicks").select(["memberId", "titleId"]).where("roomId", "=", room.id).execute();
    return new Response(superjson.stringify({
      roomId: room.id, code: room.code, name: room.name, members, picks,
    } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load room";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

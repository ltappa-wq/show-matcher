import superjson from "superjson";
import { schema, OutputType } from "./join_POST.schema";
import { db } from "../../helpers/db";
import { newId } from "../../helpers/roomCode";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const code = input.code.trim().toUpperCase();
    const room = await db.selectFrom("rooms").selectAll().where("code", "=", code).executeTakeFirst();
    if (!room) {
      return new Response(superjson.stringify({ error: "No room with that code." }), { status: 404 });
    }
    if (input.memberId) {
      const existing = await db.selectFrom("roomMembers").selectAll()
        .where("id", "=", input.memberId).where("roomId", "=", room.id).executeTakeFirst();
      if (existing) {
        return new Response(superjson.stringify({
          roomId: room.id, code: room.code, name: room.name, memberId: existing.id, displayName: existing.displayName,
        } satisfies OutputType));
      }
    }
    const memberId = newId();
    await db.insertInto("roomMembers").values({ id: memberId, roomId: room.id, displayName: input.displayName }).execute();
    return new Response(superjson.stringify({
      roomId: room.id, code: room.code, name: room.name, memberId, displayName: input.displayName,
    } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not join room";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

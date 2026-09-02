import superjson from "superjson";
import { schema, OutputType } from "./rooms_POST.schema";
import { db } from "../helpers/db";
import { newId, newRoomCode } from "../helpers/roomCode";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const roomId = newId();
    const memberId = newId();
    let code = newRoomCode();
    for (let i = 0; i < 5; i++) {
      const existing = await db.selectFrom("rooms").select("id").where("code", "=", code).executeTakeFirst();
      if (!existing) break;
      code = newRoomCode();
    }
    const name = input.name?.trim() || "Watch room";
    await db.insertInto("rooms").values({ id: roomId, code, name }).execute();
    await db.insertInto("roomMembers").values({ id: memberId, roomId, displayName: input.displayName }).execute();
    return new Response(superjson.stringify({
      roomId, code, name, memberId, displayName: input.displayName,
    } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create room";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

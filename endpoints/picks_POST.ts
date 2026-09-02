import superjson from "superjson";
import { schema, OutputType } from "./picks_POST.schema";
import { db } from "../helpers/db";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const member = await db.selectFrom("roomMembers").selectAll()
      .where("id", "=", input.memberId).where("roomId", "=", input.roomId).executeTakeFirst();
    if (!member) {
      return new Response(superjson.stringify({ error: "You are not in this room." }), { status: 403 });
    }
    if (input.picked) {
      await db.insertInto("roomPicks").values({
        roomId: input.roomId, memberId: input.memberId, titleId: input.titleId,
      }).onConflict((oc) => oc.columns(["memberId", "titleId"]).doNothing()).execute();
    } else {
      await db.deleteFrom("roomPicks").where("memberId", "=", input.memberId).where("titleId", "=", input.titleId).execute();
    }
    const members = await db.selectFrom("roomMembers").select(["id", "displayName"]).where("roomId", "=", input.roomId).orderBy("createdAt", "asc").execute();
    const picks = await db.selectFrom("roomPicks").select(["memberId", "titleId"]).where("roomId", "=", input.roomId).execute();
    return new Response(superjson.stringify({ members, picks } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save pick";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

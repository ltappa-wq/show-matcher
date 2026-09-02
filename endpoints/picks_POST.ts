import superjson from "superjson";
import { schema, OutputType } from "./picks_POST.schema";
import { db } from "../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    if (input.picked) {
      await db
        .insertInto("picks")
        .values({ seat: input.seat, titleId: input.titleId })
        .onConflict((oc) => oc.columns(["seat", "titleId"]).doNothing())
        .execute();
    } else {
      await db
        .deleteFrom("picks")
        .where("seat", "=", input.seat)
        .where("titleId", "=", input.titleId)
        .execute();
    }
    const rows = await db.selectFrom("picks").select(["seat", "titleId"]).execute();
    const a = rows.filter((r) => r.seat === "a").map((r) => r.titleId);
    const b = rows.filter((r) => r.seat === "b").map((r) => r.titleId);
    return new Response(superjson.stringify({ a, b } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save pick";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

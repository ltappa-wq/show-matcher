import superjson from "superjson";
import { schema, OutputType } from "./picks_GET.schema";
import { db } from "../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    schema.parse({ seat: url.searchParams.get("seat") ?? undefined });
    const rows = await db.selectFrom("picks").select(["seat", "titleId"]).execute();
    const a = rows.filter((r) => r.seat === "a").map((r) => r.titleId);
    const b = rows.filter((r) => r.seat === "b").map((r) => r.titleId);
    return new Response(superjson.stringify({ a, b } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load picks";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

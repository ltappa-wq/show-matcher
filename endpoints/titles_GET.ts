import superjson from "superjson";
import { schema, OutputType } from "./titles_GET.schema";
import { db } from "../helpers/db";
import { curatedCatalog } from "../helpers/curatedCatalog";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = schema.parse({ q: url.searchParams.get("q") ?? undefined });
    const q = input.q?.trim().toLowerCase();
    const rows = await db.selectFrom("titles").selectAll().orderBy("name", "asc").execute();
    const titles = rows.map((row) => ({
      id: row.id, name: row.name, year: row.year, kind: row.kind, overview: row.overview, source: row.source,
    }));
    const filtered = q ? titles.filter((t) => t.name.toLowerCase().includes(q)) : titles;
    return new Response(superjson.stringify({ titles: filtered.length ? filtered : curatedCatalog, source: "database", warning: null } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load titles";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

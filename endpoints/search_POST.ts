import superjson from "superjson";
import { schema, OutputType } from "./search_POST.schema";
import { db } from "../helpers/db";
import { curatedCatalog } from "../helpers/curatedCatalog";
import { searchTmdb } from "../helpers/tmdbSearch";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const remote = await searchTmdb(input.q.trim());
    const local = curatedCatalog.filter((t) => t.name.toLowerCase().includes(input.q.trim().toLowerCase()));
    const merged = [...remote.titles];
    for (const title of local) if (!merged.some((t) => t.id === title.id)) merged.push(title);
    if (merged.length) {
      await db.insertInto("titles").values(merged.map((title) => ({
        id: title.id, name: title.name, year: title.year, kind: title.kind, overview: title.overview, source: title.source,
      }))).onConflict((oc) => oc.column("id").doUpdateSet((eb) => ({
        name: eb.ref("excluded.name"), year: eb.ref("excluded.year"), kind: eb.ref("excluded.kind"), overview: eb.ref("excluded.overview"), source: eb.ref("excluded.source"),
      }))).execute();
    }
    return new Response(superjson.stringify({ titles: merged, warning: remote.warning } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

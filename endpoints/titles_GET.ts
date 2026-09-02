import superjson from "superjson";
import { schema, OutputType } from "./titles_GET.schema";
import { db } from "../helpers/db";
import { curatedCatalog } from "../helpers/curatedCatalog";
import { rowToTitle, upsertTitles } from "../helpers/titleCache";
import { fetchTmdbTitle } from "../helpers/tmdbSearch";
import type { TitleCard } from "../helpers/titleTypes";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = schema.parse({ q: url.searchParams.get("q") ?? undefined });
    const q = input.q?.trim().toLowerCase();
    try {
      let query = db.selectFrom("titles").selectAll().orderBy("name", "asc");
      if (q) {
        query = query.where((eb) =>
          eb.or([eb("name", "ilike", `%${q}%`), eb("overview", "ilike", `%${q}%`)]),
        );
      }
      let rows = await query.execute();
      if (!rows.length) {
        await upsertTitles(curatedCatalog);
        rows = await query.execute();
      }
      let titles = rows.map(rowToTitle);
      const missing = titles.filter((t) => !t.posterPath).slice(0, 8);
      if (missing.length) {
        const filled = await Promise.all(missing.map((t) => fetchTmdbTitle(t.id)));
        const found = filled.filter((t): t is TitleCard => Boolean(t));
        if (found.length) {
          await upsertTitles(found);
          const byId = new Map(found.map((t) => [t.id, t]));
          titles = titles.map((t) => byId.get(t.id) ?? t);
        }
      }
      return new Response(superjson.stringify({ titles, source: "database" as const, warning: null } satisfies OutputType));
    } catch {
      const titles = q
        ? curatedCatalog.filter((t) => t.name.toLowerCase().includes(q) || String(t.year).includes(q))
        : curatedCatalog;
      return new Response(superjson.stringify({
        titles, source: "catalog" as const, warning: "Database unavailable. Serving curated catalog.",
      } satisfies OutputType));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load titles";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

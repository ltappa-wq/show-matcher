import superjson from "superjson";
import { schema, OutputType } from "./search_POST.schema";
import { db } from "../helpers/db";
import { curatedCatalog } from "../helpers/curatedCatalog";
import { searchCachedTitles, upsertTitles } from "../helpers/titleCache";
import { fetchTmdbTitle, searchTmdb } from "../helpers/tmdbSearch";
import type { TitleCard } from "../helpers/titleTypes";

function mergeTitles(primary: TitleCard[], extra: TitleCard[]): TitleCard[] {
  const merged = [...primary];
  for (const title of extra) {
    const i = merged.findIndex((t) => t.id === title.id);
    if (i === -1) merged.push(title);
    else if (!merged[i].posterPath && title.posterPath) merged[i] = title;
  }
  return merged;
}

function strongHits(titles: TitleCard[], q: string): TitleCard[] {
  const key = q.toLowerCase();
  return titles.filter((t) => {
    const name = t.name.toLowerCase();
    return name === key || name.startsWith(`${key} `) || name.startsWith(key);
  });
}

async function rememberQuery(query: string, hitCount: number) {
  await db
    .insertInto("searchQueries")
    .values({ query, hitCount, lastHitAt: new Date() })
    .onConflict((oc) => oc.column("query").doUpdateSet({ hitCount, lastHitAt: new Date() }))
    .execute();
}

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const q = input.q.trim();
    const key = q.toLowerCase();
    const cached = await searchCachedTitles(q);
    const seen = await db.selectFrom("searchQueries").selectAll().where("query", "=", key).executeTakeFirst();
    const strong = strongHits(cached, q);
    const enoughArt = cached.filter((t) => t.posterPath).length >= 6;
    const knownQuery = Boolean(seen) && cached.length > 0;
    const knownTitle = strong.some((t) => t.posterPath);
    if (knownQuery || knownTitle || enoughArt) {
      if (seen) {
        await db.updateTable("searchQueries").set({ lastHitAt: new Date(), hitCount: cached.length }).where("query", "=", key).execute();
      }
      return new Response(superjson.stringify({ titles: cached, warning: null, cached: true } satisfies OutputType));
    }
    const remote = await searchTmdb(q);
    const seedHits = curatedCatalog.filter((t) => t.name.toLowerCase().includes(key));
    const merged = mergeTitles(mergeTitles(remote.titles, cached), seedHits);
    const missingArt = merged.filter((t) => !t.posterPath).slice(0, 6);
    const filled = await Promise.all(missingArt.map((t) => fetchTmdbTitle(t.id)));
    const withArt = mergeTitles(merged, filled.filter((t): t is TitleCard => Boolean(t)));
    await upsertTitles(withArt);
    if (withArt.length) await rememberQuery(key, withArt.length);
    return new Response(superjson.stringify({ titles: withArt, warning: remote.warning, cached: false } satisfies OutputType));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    return new Response(superjson.stringify({ error: message }), { status: 400 });
  }
}

import { db } from "./db";
import type { TitleCard } from "./titleTypes";
import { curatedCatalog } from "./curatedCatalog";

export function rowToTitle(row: {
  id: string;
  name: string;
  year: number;
  kind: TitleCard["kind"];
  overview: string;
  source: TitleCard["source"];
  posterPath: string | null;
}): TitleCard {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    kind: row.kind,
    overview: row.overview,
    source: row.source,
    posterPath: row.posterPath,
  };
}

export async function upsertTitles(titles: TitleCard[]): Promise<void> {
  if (!titles.length) return;
  await db
    .insertInto("titles")
    .values(
      titles.map((title) => ({
        id: title.id,
        name: title.name,
        year: title.year,
        kind: title.kind,
        overview: title.overview,
        source: title.source,
        posterPath: title.posterPath,
      })),
    )
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        name: eb.ref("excluded.name"),
        year: eb.ref("excluded.year"),
        kind: eb.ref("excluded.kind"),
        overview: eb.ref("excluded.overview"),
        source: eb.ref("excluded.source"),
        posterPath: eb.ref("excluded.posterPath"),
      })),
    )
    .execute();
}

export async function searchCachedTitles(q: string): Promise<TitleCard[]> {
  const rows = await db
    .selectFrom("titles")
    .selectAll()
    .where((eb) => eb.or([eb("name", "ilike", `%${q}%`), eb("overview", "ilike", `%${q}%`)]))
    .orderBy("name", "asc")
    .limit(24)
    .execute();
  if (rows.length) return rows.map(rowToTitle);
  return curatedCatalog.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
}

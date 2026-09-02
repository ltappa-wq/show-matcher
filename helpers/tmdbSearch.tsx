import type { TitleCard } from "./titleTypes";
import { tmdbConfigured, tmdbGet } from "./tmdbClient";

type TmdbResult = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbResponse = { results?: TmdbResult[] };

export { tmdbConfigured };

function toCard(row: TmdbResult, kindHint?: "movie" | "tv"): TitleCard | null {
  const kind = kindHint ?? (row.media_type === "tv" ? "tv" : row.media_type === "movie" ? "movie" : null);
  if (!kind) return null;
  const date = kind === "tv" ? row.first_air_date : row.release_date;
  return {
    id: `${kind}-${row.id}`,
    name: (kind === "tv" ? row.name : row.title) || "Untitled",
    year: date ? Number(date.slice(0, 4)) || 0 : 0,
    kind,
    overview: row.overview || "",
    source: "tmdb",
    posterPath: row.poster_path ?? null,
  };
}

export async function searchTmdb(query: string): Promise<{ titles: TitleCard[]; warning: string | null }> {
  if (!tmdbConfigured()) {
    return { titles: [], warning: "TMDB is not connected. Using the cached catalog only." };
  }
  try {
    const res = await tmdbGet("/search/multi", { query, include_adult: "false" });
    if (!res.ok) {
      return { titles: [], warning: `TMDB returned ${res.status}. Using cached titles.` };
    }
    const data = (await res.json()) as TmdbResponse;
    const titles = (data.results ?? [])
      .map((row) => toCard(row))
      .filter((row): row is TitleCard => Boolean(row))
      .slice(0, 20);
    return { titles, warning: null };
  } catch {
    return { titles: [], warning: "TMDB is temporarily unavailable. Using cached titles." };
  }
}

export async function fetchTmdbTitle(id: string): Promise<TitleCard | null> {
  const match = /^(movie|tv)-(\d+)$/.exec(id);
  if (!match || !tmdbConfigured()) return null;
  const kind = match[1] as "movie" | "tv";
  const tmdbId = match[2];
  try {
    const res = await tmdbGet(`/${kind}/${tmdbId}`);
    if (!res.ok) return null;
    const row = (await res.json()) as TmdbResult;
    return toCard({ ...row, media_type: kind }, kind);
  } catch {
    return null;
  }
}

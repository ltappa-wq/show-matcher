import type { TitleCard } from "./titleTypes";

export async function searchTmdb(query: string): Promise<{ titles: TitleCard[]; warning: string | null }> {
  const env = process.env as Record<string, string | undefined>;
  const token = env.TMDB_ACCESS_TOKEN;
  const apiKey = env.TMDB_API_KEY;
  if (!token && !apiKey) {
    return { titles: [], warning: "TMDB is not connected. Using the curated catalog only." };
  }
  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  if (!token && apiKey) url.searchParams.set("api_key", apiKey);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) return { titles: [], warning: `TMDB returned ${res.status}. Falling back to the curated catalog.` };
  const data = await res.json();
  const titles = (data.results ?? [])
    .filter((row: { media_type?: string }) => row.media_type === "movie" || row.media_type === "tv")
    .slice(0, 20)
    .map((row: any) => {
      const kind = row.media_type === "tv" ? "tv" : "movie";
      const date = kind === "tv" ? row.first_air_date : row.release_date;
      return {
        id: `${kind}-${row.id}`,
        name: (kind === "tv" ? row.name : row.title) || "Untitled",
        year: date ? Number(String(date).slice(0, 4)) || 0 : 0,
        kind,
        overview: row.overview || "",
        source: "tmdb" as const,
      };
    });
  return { titles, warning: null };
}

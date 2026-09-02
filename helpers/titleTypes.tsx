export type MediaKind = "movie" | "tv";
export type TitleSource = "catalog" | "tmdb";

export type TitleCard = {
  id: string;
  name: string;
  year: number;
  kind: MediaKind;
  overview: string;
  source: TitleSource;
  posterPath: string | null;
};

export function posterUrl(path: string | null | undefined, size: "w185" | "w342" = "w342"): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path.startsWith("/") ? path : `/${path}`}`;
}

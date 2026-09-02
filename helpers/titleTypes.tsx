export type MediaKind = "movie" | "tv";
export type TitleSource = "catalog" | "tmdb";
export type SeatCode = "a" | "b";

export type TitleCard = {
  id: string;
  name: string;
  year: number;
  kind: MediaKind;
  overview: string;
  source: TitleSource;
};

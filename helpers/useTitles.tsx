import { useQuery } from "@tanstack/react-query";
import { getTitles } from "../endpoints/titles_GET.schema";

export const useTitles = (q?: string) => {
  return useQuery({
    queryKey: ["titles", q ?? ""],
    queryFn: () => getTitles({ q: q || undefined }),
    placeholderData: (prev) => prev,
  });
};

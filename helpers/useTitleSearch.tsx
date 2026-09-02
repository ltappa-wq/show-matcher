import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postSearch } from "../endpoints/search_POST.schema";

export const useTitleSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (q: string) => postSearch({ q }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["titles"] });
    },
  });
};

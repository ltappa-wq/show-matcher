import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPicks } from "../endpoints/picks_GET.schema";
import { postPicks, InputType } from "../endpoints/picks_POST.schema";

export const usePicks = () => {
  return useQuery({
    queryKey: ["picks"],
    queryFn: () => getPicks(),
  });
};

export const useTogglePick = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InputType) => postPicks(body),
    onSuccess: (data) => {
      queryClient.setQueryData(["picks"], data);
      void queryClient.invalidateQueries({ queryKey: ["picks"] });
    },
  });
};

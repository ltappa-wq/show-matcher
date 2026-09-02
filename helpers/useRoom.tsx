import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRooms } from "../endpoints/rooms_GET.schema";
import { postRooms } from "../endpoints/rooms_POST.schema";
import { postRoomsJoin } from "../endpoints/rooms/join_POST.schema";
import { getPicks } from "../endpoints/picks_GET.schema";
import { postPicks, InputType } from "../endpoints/picks_POST.schema";

export const useRoom = (code?: string) => {
  return useQuery({
    queryKey: ["room", code ?? ""],
    queryFn: () => getRooms({ code: code ?? "" }),
    enabled: Boolean(code),
    refetchInterval: 4000,
  });
};

export const useCreateRoom = () => useMutation({ mutationFn: postRooms });
export const useJoinRoom = () => useMutation({ mutationFn: postRoomsJoin });

export const useRoomPicks = (roomId?: string) => {
  return useQuery({
    queryKey: ["picks", roomId ?? ""],
    queryFn: () => getPicks({ roomId: roomId ?? "" }),
    enabled: Boolean(roomId),
    refetchInterval: 4000,
  });
};

export const useToggleRoomPick = (roomId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InputType) => postPicks(body),
    onSuccess: (data) => {
      queryClient.setQueryData(["picks", roomId ?? ""], data);
      void queryClient.invalidateQueries({ queryKey: ["room"] });
      void queryClient.invalidateQueries({ queryKey: ["picks", roomId ?? ""] });
    },
  });
};

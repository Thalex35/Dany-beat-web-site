import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { formatCount } from "@/lib/beats";
import { cn } from "@/lib/utils";

export function LikeButton({
  beatId,
  count,
  className,
}: {
  beatId: string;
  count?: number | undefined;
  className?: string | undefined;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: liked } = useQuery({
    queryKey: ["like", beatId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("beat_id", beatId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (nextLiked: boolean) => {
      if (!user) throw new Error("auth");
      if (nextLiked) {
        const { error } = await supabase
          .from("likes")
          .insert({ beat_id: beatId, user_id: user.id });
        if (error && error.code !== "23505") throw error;
        void track("beat_like", { beatId });
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("beat_id", beatId)
          .eq("user_id", user.id);
        if (error) throw error;
        void track("beat_unlike", { beatId });
      }
      return nextLiked;
    },
    onMutate: async (nextLiked) => {
      await queryClient.cancelQueries({ queryKey: ["like", beatId, user?.id] });
      const previous = queryClient.getQueryData(["like", beatId, user?.id]);
      queryClient.setQueryData(["like", beatId, user?.id], nextLiked);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["like", beatId, user?.id], context?.previous);
      toast.error("Could not update your like. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["beat-stats"] });
      queryClient.invalidateQueries({ queryKey: ["liked-beats"] });
    },
  });

  const optimisticLiked = mutation.isPending ? (mutation.variables ?? !!liked) : !!liked;
  const optimisticCount = (count ?? 0) + (optimisticLiked ? 1 : 0) - (liked ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={!!liked}
      aria-label={liked ? "Unlike this beat" : "Like this beat"}
      onClick={() => {
        if (!user) {
          toast("Sign in to like beats");
          navigate({ to: "/auth", search: { redirect: window.location.pathname } });
          return;
        }
        mutation.mutate(!liked);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground transition-colors hover:text-foreground",
        liked && "text-primary hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("size-4", optimisticLiked && "fill-current")} aria-hidden="true" />
      <span className="tabular-nums">{formatCount(optimisticCount)}</span>
    </button>
  );
}

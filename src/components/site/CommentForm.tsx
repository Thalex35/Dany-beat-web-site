import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { COMMENT_MAX, COMMENT_MIN, validateComment } from "@/lib/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

export function CommentForm({ beatId }: { beatId: string }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("comments")
        .insert({ beat_id: beatId, user_id: user!.id, content: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setValidationError(null);
      queryClient.invalidateQueries({ queryKey: ["comments", beatId] });
      queryClient.invalidateQueries({ queryKey: ["beat-stats"] });
      void track("beat_comment", { beatId }).catch(() => {});
      toast.success("Comment posted.");
    },
    onError: () => {
      toast.error("Could not post your comment. Please try again.");
    },
  });

  if (!user) {
    return (
      <div className="panel flex flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Want to share your thoughts? Sign in to leave a comment.
        </p>
        <Button
          size="sm"
          onClick={() => {
            void navigate({ to: "/auth", search: { redirect: window.location.pathname } } as any);
          }}
        >
          Sign in to comment
        </Button>
      </div>
    );
  }

  const remaining = COMMENT_MAX - content.length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const err = validateComment(content);
        if (err) {
          setValidationError(err);
          return;
        }
        setValidationError(null);
        mutation.mutate(content);
      }}
      className="panel flex flex-col gap-3 px-5 py-5"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Commenting as
        <span className="font-medium text-foreground">
          {profile?.display_name ?? user.email ?? "You"}
        </span>
      </div>
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (validationError) setValidationError(null);
        }}
        placeholder="Share your feedback about this beat"
        aria-label="Comment text"
        maxLength={COMMENT_MAX}
        minLength={COMMENT_MIN}
        disabled={mutation.isPending}
        className="min-h-20"
      />
      {validationError ? <p className="text-xs text-destructive">{validationError}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-xs tabular-nums ${remaining < 50 ? "text-destructive" : "text-muted-foreground"}`}
        >
          {remaining} characters left
        </span>
        <Button type="submit" size="sm" disabled={mutation.isPending || !content.trim()}>
          {mutation.isPending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
}

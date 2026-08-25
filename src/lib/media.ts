import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

const ONE_HOUR = 60 * 60;

/**
 * Media lives in private buckets. Public-facing assets (covers, previews) are
 * readable by everyone through RLS, but are still served via time-limited
 * signed URLs so masters/full-length files can stay locked down later.
 */
export async function signedUrl(bucket: string, path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ONE_HOUR);
  if (error) return null;
  return data.signedUrl;
}

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-url", bucket, path],
    enabled: !!path,
    staleTime: (ONE_HOUR - 300) * 1000,
    queryFn: () => signedUrl(bucket, path),
  });
}

export function fileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

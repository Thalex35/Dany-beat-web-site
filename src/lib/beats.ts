import { supabase } from "@/integrations/supabase/client";

export type License = { id: string; name: string; price: number; files: string; terms?: string };

export type Beat = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  song_key: string | null;
  price: number;
  licenses: License[];
  tags: string[];
  cover_path: string | null;
  preview_path: string | null;
  master_path: string | null;
  status: "draft" | "published";
  featured: boolean;
  created_at: string;
  published_at: string | null;
};

export type BeatStats = {
  beat_id: string;
  likes: number;
  comments: number;
  plays: number;
  views: number;
};

export const BEAT_COLUMNS =
  "id, title, slug, description, genre, mood, bpm, song_key, price, licenses, tags, cover_path, preview_path, master_path, status, featured, created_at, published_at";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const publishedBeatsQuery = {
  queryKey: ["beats", "published"],
  queryFn: async (): Promise<Beat[]> => {
    const { data, error } = await supabase
      .from("beats")
      .select(BEAT_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as unknown as Beat[];
  },
};

export const beatStatsQuery = {
  queryKey: ["beat-stats"],
  staleTime: 30_000,
  queryFn: async (): Promise<Record<string, BeatStats>> => {
    const { data, error } = await supabase.rpc("beat_public_stats");
    if (error) throw error;
    const map: Record<string, BeatStats> = {};
    for (const row of (data ?? []) as BeatStats[]) map[row.beat_id] = row;
    return map;
  },
};

export function formatPrice(value: number | null | undefined) {
  if (value == null) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export function formatCount(value: number | undefined) {
  const n = value ?? 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

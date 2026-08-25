import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";

import { Cover } from "@/components/site/Cover";
import { LikeButton } from "@/components/site/LikeButton";
import { formatCount, formatPrice, type Beat, type BeatStats } from "@/lib/beats";
import { usePlayer } from "@/lib/player";

export function BeatCard({ beat, stats }: { beat: Beat; stats?: BeatStats }) {
  const { current, playing, toggle } = usePlayer();
  const isCurrent = current?.id === beat.id;
  const isPlaying = isCurrent && playing;

  return (
    <article className="group flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-border">
        <Link
          to="/beats/$slug"
          params={{ slug: beat.slug }}
          aria-label={`Open ${beat.title}`}
          className="block h-full w-full"
        >
          <Cover path={beat.cover_path} alt={`${beat.title} cover art`} className="h-full w-full" />
        </Link>
        {beat.bpm ? (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-background/90 px-2 py-1 text-[10px] font-medium tracking-wide uppercase backdrop-blur-sm">
            {beat.bpm} BPM
          </div>
        ) : null}
        {beat.featured ? (
          <div className="pointer-events-none absolute top-3 left-3 rounded bg-primary px-2 py-1 text-[10px] font-medium tracking-wide text-primary-foreground uppercase">
            Featured
          </div>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium">
            <Link to="/beats/$slug" params={{ slug: beat.slug }} className="hover:text-primary">
              {beat.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[beat.genre, beat.mood].filter(Boolean).join(" • ") || "Instrumental"}
          </p>
        </div>
        <span className="font-display font-medium text-primary">{formatPrice(beat.price)}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() =>
            toggle({
              id: beat.id,
              title: beat.title,
              slug: beat.slug,
              bpm: beat.bpm,
              coverPath: beat.cover_path,
              previewPath: beat.preview_path,
            })
          }
          aria-label={isPlaying ? `Pause ${beat.title}` : `Play ${beat.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <div className="flex items-center gap-5 text-[10px] tracking-widest text-muted-foreground uppercase">
          <span>{formatCount(stats?.plays)} Plays</span>
          <LikeButton beatId={beat.id} count={stats?.likes} />
        </div>
      </div>
    </article>
  );
}

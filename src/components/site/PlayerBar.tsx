import { Link } from "@tanstack/react-router";
import { Pause, Play, Volume2, X } from "lucide-react";

import { Cover } from "@/components/site/Cover";
import { Spinner } from "@/components/ui/states";
import { formatTime } from "@/lib/beats";
import { usePlayer } from "@/lib/player";

export function PlayerBar() {
  const { current, playing, loading, error, progress, duration, volume, toggle, seek, setVolume, stop } =
    usePlayer();

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-5">
      <div className="mx-auto max-w-5xl rounded-2xl bg-surface/95 p-3 shadow-2xl ring-1 ring-border backdrop-blur-xl sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/beats/$slug"
            params={{ slug: current.slug }}
            className="shrink-0"
            aria-label={`Open ${current.title}`}
          >
            <Cover path={current.coverPath} alt="" className="size-10 rounded-lg sm:size-12" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{current.title}</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {current.bpm ? `${current.bpm} BPM • ` : ""}Preview
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Volume2 className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Volume"
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-20 accent-[var(--primary)]"
            />
          </div>
          <button
            onClick={() => toggle()}
            aria-label={playing ? "Pause preview" : "Play preview"}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
          >
            {loading ? <Spinner /> : playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button
            onClick={stop}
            aria-label="Close player"
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-9 text-[10px] tabular-nums text-muted-foreground">
            {formatTime(progress)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            aria-label="Seek"
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 flex-1 accent-[var(--primary)]"
          />
          <span className="w-9 text-right text-[10px] tabular-nums text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

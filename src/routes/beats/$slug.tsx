import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  Headphones,
  Heart,
  MessageCircle,
  Music2,
  Pause,
  Play,
  Tag,
  Thermometer,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { Cover } from "@/components/site/Cover";
import { CommentForm } from "@/components/site/CommentForm";
import { CommentList } from "@/components/site/CommentList";
import { LikeButton } from "@/components/site/LikeButton";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import {
  beatBySlugQuery,
  beatStatsByIdQuery,
  formatCount,
  formatPrice,
  type License,
} from "@/lib/beats";
import { usePlayer } from "@/lib/player";
import { startPurchase } from "@/lib/purchase";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/beats/$slug")({
  head: ({ params }) => {
    const slug = params.slug;
    return {
      meta: [
        { title: `${slug} — Dany Beats` },
        {
          name: "description",
          content: `Listen to and license the instrumental "${slug}" from Dany Beats.`,
        },
        { property: "og:title", content: `${slug} — Dany Beats` },
        { property: "og:type", content: "music.song" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BeatDetailPage,
  notFoundComponent: BeatNotFound,
});

function BeatNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8 sm:py-32">
      <h1 className="font-display text-4xl font-semibold tracking-tighter sm:text-5xl">
        Beat not found
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This beat doesn't exist or isn't available yet.
      </p>
      <Button asChild className="mt-8">
        <Link to="/beats">Back to catalog</Link>
      </Button>
    </div>
  );
}

function BeatDetailPage() {
  const { slug } = Route.useParams();
  const beatQuery = useQuery(beatBySlugQuery(slug));
  const { user, profile } = useAuth();
  const { data: settings } = useSettings();
  const { current, playing, toggle, loading: playerLoading, error: playerError } = usePlayer();
  const navigate = useNavigate();

  const beat = beatQuery.data;
  const statsQuery = useQuery({
    ...beatStatsByIdQuery(beat?.id ?? ""),
    enabled: !!beat?.id,
  });
  const stats = statsQuery.data;

  const viewedRef = useRef<string | null>(null);

  useEffect(() => {
    if (beat?.id && viewedRef.current !== beat.id) {
      viewedRef.current = beat.id;
      void track("beat_view", { beatId: beat.id, once: true });
    }
  }, [beat?.id]);

  if (beatQuery.isPending) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-[400px_1fr]">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full max-w-xs" />
          </div>
        </div>
      </div>
    );
  }

  if (beatQuery.isError || !beat) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 sm:px-8 sm:py-32">
        {beatQuery.isError ? (
          <ErrorState
            description="We couldn't load this beat. Please try again."
            onRetry={() => void beatQuery.refetch()}
          />
        ) : (
          <EmptyState
            title="Beat not found"
            description="This beat doesn't exist or isn't available yet."
            action={
              <Button asChild>
                <Link to="/beats">Back to catalog</Link>
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const isCurrent = current?.id === beat.id;
  const isPlaying = isCurrent && playing;
  const hasPreview = !!beat.preview_path;
  const whatsappNumber = settings?.whatsapp_number ?? "";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <Link
        to="/beats"
        className="inline-flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All beats
      </Link>

      <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
        {/* Cover + player controls */}
        <div className="flex flex-col gap-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-border">
            <Cover
              path={beat.cover_path}
              alt={`${beat.title} cover art`}
              className="h-full w-full"
            />
            {beat.featured ? (
              <div className="pointer-events-none absolute top-3 left-3 rounded bg-primary px-2 py-1 text-[10px] font-medium tracking-wide text-primary-foreground uppercase">
                Featured
              </div>
            ) : null}
          </div>

          {hasPreview ? (
            <div className="flex items-center gap-3">
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
                className="grid size-12 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
              >
                {playerLoading && isCurrent ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="size-5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {isCurrent && playing ? "Now playing" : "Preview"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {isCurrent ? "Use the player bar for controls" : "Tap play to preview this beat"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No preview available for this beat.</p>
          )}

          {isCurrent && playerError ? (
            <p className="text-xs text-destructive">{playerError}</p>
          ) : null}
        </div>

        {/* Beat info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tighter sm:text-4xl">
              {beat.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              by {settings?.producer_name ?? "Dany Beats"}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Headphones className="size-3.5" aria-hidden="true" />
              {formatCount(stats?.plays)} Plays
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden="true" />
              {formatCount(stats?.views)} Views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-3.5" aria-hidden="true" />
              {formatCount(stats?.likes)} Likes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-3.5" aria-hidden="true" />
              {formatCount(stats?.comments)} Comments
            </span>
          </div>

          {/* Price + CTA */}
          <div className="panel flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                Starting at
              </p>
              <p className="font-display text-2xl font-semibold text-primary">
                {formatPrice(beat.price)}
              </p>
            </div>
            <Button
              variant="whatsapp"
              size="lg"
              block
              className="sm:w-auto"
              onClick={() => {
                void startPurchase({
                  beatId: beat.id,
                  beatTitle: beat.title,
                  price: beat.price,
                  producerName: settings?.producer_name ?? "Dany Beats",
                  buyerName: profile?.display_name ?? null,
                  whatsappNumber,
                });
              }}
            >
              <MessageCircle />
              Purchase / Inquire
            </Button>
          </div>

          {/* Description */}
          {beat.description ? (
            <div>
              <h2 className="font-display text-sm tracking-wide uppercase">About this beat</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {beat.description}
              </p>
            </div>
          ) : null}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl ring-1 ring-border">
            <MetaRow icon={<Music2 className="size-3.5" />} label="Genre" value={beat.genre} />
            <MetaRow icon={<Thermometer className="size-3.5" />} label="Mood" value={beat.mood} />
            <MetaRow label="BPM" value={beat.bpm ? String(beat.bpm) : null} />
            <MetaRow label="Key" value={beat.song_key} />
          </div>

          {/* Tags */}
          {beat.tags.length > 0 ? (
            <div>
              <h2 className="font-display text-sm tracking-wide uppercase">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {beat.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs text-muted-foreground"
                  >
                    <Tag className="size-3" aria-hidden="true" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Licenses */}
          {beat.licenses.length > 0 ? (
            <div>
              <h2 className="font-display text-sm tracking-wide uppercase">License options</h2>
              <div className="mt-3 space-y-2">
                {beat.licenses.map((lic: License, i) => (
                  <div
                    key={lic.id ?? i}
                    className="panel flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{lic.name}</p>
                      {lic.files ? (
                        <p className="truncate text-[10px] text-muted-foreground">{lic.files}</p>
                      ) : null}
                      {lic.terms ? (
                        <p className="mt-1 text-xs text-muted-foreground">{lic.terms}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-medium text-primary">
                      {lic.price > 0 ? formatPrice(lic.price) : "Included"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Like button */}
          <div className="flex items-center gap-3 border-t border-border pt-5">
            <LikeButton beatId={beat.id} count={stats?.likes} className="text-sm" />
          </div>
        </div>
      </div>

      {/* Comments section */}
      <section className="mt-16 border-t border-border pt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Comments</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your feedback or ask about licensing.
        </p>

        <div className="mt-6 flex flex-col gap-6">
          <CommentForm beatId={beat.id} />
          <CommentList beatId={beat.id} />
        </div>
      </section>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] tracking-widest text-muted-foreground uppercase">
        {icon}
        {label}
      </dt>
      <dd className={cn("text-sm font-medium", !value && "text-muted-foreground/60")}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

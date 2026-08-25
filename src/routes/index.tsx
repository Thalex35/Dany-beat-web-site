import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, Music4, Sparkles } from "lucide-react";

import { BeatCard } from "@/components/site/BeatCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { beatStatsQuery, publishedBeatsQuery } from "@/lib/beats";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dany Beats — Premium Rap & Trap Instrumentals" },
      {
        name: "description",
        content:
          "Stream original rap, trap and afro instrumentals. Preview every beat, then reach the producer directly on WhatsApp to license it.",
      },
      { property: "og:title", content: "Dany Beats — Premium Rap & Trap Instrumentals" },
      {
        property: "og:description",
        content: "Stream original instrumentals and license them directly with the producer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const beats = useQuery(publishedBeatsQuery);
  const stats = useQuery(beatStatsQuery);
  const { data: settings } = useSettings();

  const featured = (beats.data ?? []).filter((b) => b.featured).slice(0, 6);
  const list = featured.length ? featured : (beats.data ?? []).slice(0, 6);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <p className="flex items-center gap-2 text-[11px] tracking-[0.3em] text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Independent beat catalog
          </p>
          <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[0.95] font-semibold tracking-tighter text-balance sm:text-7xl">
            Instrumentals built for artists who take the record seriously.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {settings?.producer_bio ??
              "Original rap, trap and afro production. Preview the full catalog, then message the producer directly to lock your license."}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/beats">
                Browse the catalog
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/about">About the producer</Link>
            </Button>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-8">
            {[
              { icon: Music4, label: "Beats online", value: beats.data?.length ?? "—" },
              { icon: Headphones, label: "Free previews", value: "Always" },
              { icon: Sparkles, label: "Licensing", value: "Direct" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  <item.icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="font-display mt-2 text-2xl font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Featured beats</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hand-picked selections from the current catalog.
            </p>
          </div>
          <Link
            to="/beats"
            className="hidden text-xs tracking-widest text-primary uppercase hover:underline sm:block"
          >
            View all
          </Link>
        </div>

        <div className="mt-10">
          {beats.isPending ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : beats.isError ? (
            <ErrorState
              description="The catalog could not be loaded right now."
              onRetry={() => void beats.refetch()}
            />
          ) : list.length === 0 ? (
            <EmptyState
              title="No beats published yet"
              description="New instrumentals are on the way — check back shortly."
            />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((beat) => {
                const s = stats.data?.[beat.id];
                return s ? (
                  <BeatCard key={beat.id} beat={beat} stats={s} />
                ) : (
                  <BeatCard key={beat.id} beat={beat} />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

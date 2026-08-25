import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Producer | Dany Beats" },
      {
        name: "description",
        content:
          "Meet the producer behind Dany Beats: production style, credits and how to get in touch about licensing an instrumental.",
      },
      { property: "og:title", content: "About the Producer | Dany Beats" },
      {
        property: "og:description",
        content: "Production style, credits and direct contact for beat licensing.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useSettings();
  const whatsapp = settings?.whatsapp_number?.replace(/\D/g, "");

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-[11px] tracking-[0.3em] text-primary uppercase">The producer</p>
        <h1 className="font-display mt-5 text-4xl font-semibold tracking-tighter sm:text-6xl">
          {settings?.producer_name ?? "Dany Beats"}
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          {(
            settings?.producer_bio ??
            "Producer, mixer and sound designer crafting rap, trap and afro instrumentals for independent artists. Every beat in this catalog is written, arranged and mixed in-house, and delivered with the stems and licensing terms your release needs."
          )
            .split("\n")
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/beats">Hear the catalog</Link>
          </Button>
          {whatsapp ? (
            <Button asChild variant="whatsapp" size="lg">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <MessageCircle />
                Message on WhatsApp
              </a>
            </Button>
          ) : null}
          {settings?.contact_email ? (
            <Button asChild variant="outline" size="lg">
              <a href={`mailto:${settings.contact_email}`}>
                <Mail />
                Email
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </SiteLayout>
  );
}

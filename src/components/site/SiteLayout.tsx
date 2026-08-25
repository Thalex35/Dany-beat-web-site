import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Header } from "@/components/site/Header";
import { PlayerBar } from "@/components/site/PlayerBar";
import { usePlayer } from "@/lib/player";
import { useSettings } from "@/lib/settings";

function Footer() {
  const { data: settings } = useSettings();
  const socials = [
    { url: settings?.instagram_url, label: "Instagram" },
    { url: settings?.youtube_url, label: "YouTube" },
    { url: settings?.tiktok_url, label: "TikTok" },
  ].filter((s) => !!s.url);

  return (
    <footer className="mt-24 border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm tracking-tighter uppercase">
            {settings?.producer_name ?? "Dany Beats"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            © {new Date().getFullYear()} — Original instrumentals, licensed for artists.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
          <Link to="/beats" className="hover:text-foreground">
            Catalog
          </Link>
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          {settings?.contact_email ? (
            <a href={`mailto:${settings.contact_email}`} className="hover:text-foreground">
              {settings.contact_email}
            </a>
          ) : null}
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.url!}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { current } = usePlayer();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={current ? "flex-1 pb-40" : "flex-1 pb-10"}>{children}</main>
      <Footer />
      <PlayerBar />
    </div>
  );
}

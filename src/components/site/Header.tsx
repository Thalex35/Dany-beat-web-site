import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut, useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

const links = [
  { to: "/", label: "Home" },
  { to: "/beats", label: "Beats" },
  { to: "/about", label: "About" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, profile } = useAuth();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="font-display text-xl font-semibold tracking-tighter uppercase">
          {settings?.producer_name ?? "Dany Beats"}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
          ) : null}
          {user ? (
            <>
              <Button asChild variant="surface" size="sm">
                <Link to="/profile">{profile?.display_name ?? "My account"}</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>

        <button
          className="grid size-9 place-items-center rounded-full ring-1 ring-border md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                Admin
              </Link>
            ) : null}
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  {profile?.display_name ?? "My account"}
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                  className="rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

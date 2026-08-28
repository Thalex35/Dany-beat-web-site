import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signIn, signInWithGoogle, signUp, useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";

/**
 * Only ever redirect back to a path inside this app. Anything else (a full
 * URL, a protocol-relative "//host/path", or a missing leading slash) is
 * rejected so /auth can never be used as an open redirect.
 */
function safeRedirect(value: string | undefined): string {
  if (!value) return "/beats";
  if (!value.startsWith("/") || value.startsWith("//")) return "/beats";
  return value;
}

const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create an Account | Dany Beats" },
      {
        name: "description",
        content: "Sign in to like beats, comment on instrumentals and keep track of your favourite productions.",
      },
      { property: "og:title", content: "Sign In | Dany Beats" },
      {
        property: "og:description",
        content: "Access your Dany Beats account to like and comment on instrumentals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: authSearchSchema,
  component: AuthPage,
});

type Mode = "sign-in" | "sign-up";

function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email or password doesn't match our records.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Your password is too short. Use at least 6 characters.";
  }
  if (lower.includes("email") && lower.includes("invalid")) {
    return "That doesn't look like a valid email address.";
  }
  if (lower.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const destination = safeRedirect(redirect);

  // Already signed in — redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      void navigate({ to: destination, replace: true });
    }
  }, [authLoading, user, destination, navigate]);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!emailPattern.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (mode === "sign-up" && password.length < 6) {
      errors.password = "Use at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password);
        void track("user_login").catch(() => {});
        await navigate({ to: destination, replace: true });
      } else {
        const result = await signUp(email.trim(), password);
        void track("user_signup").catch(() => {});
        if (result.needsEmailConfirmation) {
          setEmailSent(true);
        } else {
          await navigate({ to: destination, replace: true });
        }
      }
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      void track("user_login_google").catch(() => {});
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="font-display block text-center text-xl font-semibold tracking-tighter uppercase">
          Dany Beats
        </Link>

        {/* Email Confirmation Message */}
        {emailSent ? (
          <div className="mt-10 rounded-3xl bg-surface p-6 text-center ring-1 ring-border">
            <h1 className="font-display text-xl">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. Confirm it to finish creating your account.
            </p>
          </div>
        ) : (
          <>
            {/* Title and Subtitle */}
            <h1 className="font-display mt-10 text-center text-3xl font-semibold tracking-tight">
              {mode === "sign-in" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Like beats, comment and keep your favourites in one place.
            </p>

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="surface"
              size="lg"
              className="mt-8 w-full"
              disabled={submitting}
              onClick={() => void handleGoogleSignIn()}
            >
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-[10px] tracking-widest text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "sign-up" && (
                <Field label="Display name" htmlFor="displayName">
                  <Input
                    id="displayName"
                    type="text"
                    autoComplete="nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we call you?"
                    disabled={submitting}
                  />
                </Field>
              )}
              <Field label="Email" htmlFor="auth-email" error={fieldErrors.email ?? null}>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password" htmlFor="auth-password" error={fieldErrors.password ?? null}>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  placeholder="••••••••"
                />
              </Field>

              {formError && <p className="text-sm text-destructive">{formError}</p>}
              {infoMessage && <p className="text-sm text-foreground">{infoMessage}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? mode === "sign-in"
                    ? "Signing in…"
                    : "Creating account…"
                  : mode === "sign-in"
                    ? "Sign in"
                    : "Create account"}
              </Button>
            </form>

            {/* Mode Toggle */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "sign-in" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-4"
                    onClick={() => {
                      setMode("sign-up");
                      setFormError(null);
                      setFieldErrors({});
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary underline underline-offset-4"
                    onClick={() => {
                      setMode("sign-in");
                      setFormError(null);
                      setFieldErrors({});
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

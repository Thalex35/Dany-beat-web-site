import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signIn, signUp, useAuth } from "@/lib/auth";

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
      { title: "Sign In | Dany Beats" },
      {
        name: "description",
        content: "Sign in or create an account to like beats and join the conversation.",
      },
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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = safeRedirect(redirect);

  // Already signed in (e.g. arrived here directly, or a session already
  // exists) — no need to show the form, just continue on.
  if (!authLoading && user) {
    void navigate({ to: destination, replace: true });
  }

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
        await navigate({ to: destination, replace: true });
      } else {
        const result = await signUp(email.trim(), password);
        if (result.needsEmailConfirmation) {
          setInfoMessage("Check your email to confirm your account before signing in.");
          setMode("sign-in");
          setPassword("");
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

  return (
    <SiteLayout>
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-[11px] tracking-[0.3em] text-primary uppercase">
          {mode === "sign-in" ? "Welcome back" : "Create an account"}
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tighter sm:text-4xl">
          {mode === "sign-in" ? "Sign in" : "Sign up"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "sign-in"
            ? "Sign in to like beats and join the conversation."
            : "Create an account to like beats and leave comments."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="auth-email" error={fieldErrors.email ?? null}>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
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
            />
          </Field>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          {infoMessage ? <p className="text-sm text-foreground">{infoMessage}</p> : null}

          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting
              ? mode === "sign-in"
                ? "Signing in…"
                : "Creating account…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
            setFormError(null);
            setInfoMessage(null);
            setFieldErrors({});
          }}
        >
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <span className="font-medium text-foreground">Sign up</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-medium text-foreground">Sign in</span>
            </>
          )}
        </button>
      </div>
    </SiteLayout>
  );
}

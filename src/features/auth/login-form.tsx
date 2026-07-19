"use client";

import { useActionState } from "react";

import { sendMagicLink, signInWithPassword, type AuthActionState } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, initialState);
  const [magicState, magicAction, magicPending] = useActionState(sendMagicLink, initialState);

  return (
    <div className="space-y-6">
      <form action={passwordAction} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Work email
          </label>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="password"
            name="password"
            autoComplete="current-password"
            type="password"
            required
          />
        </div>
        {passwordState.error ? (
          <p className="text-sm text-destructive" role="alert">
            {passwordState.error}
          </p>
        ) : null}
        <Button className="w-full" disabled={passwordPending} type="submit">
          {passwordPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={magicAction} className="space-y-3" noValidate>
        <p className="text-sm text-muted-foreground">Use a passwordless link instead.</p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="magic-email">
            Work email
          </label>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            id="magic-email"
            name="email"
            autoComplete="email"
            type="email"
            required
          />
        </div>
        {magicState.error ? (
          <p className="text-sm text-destructive" role="alert">
            {magicState.error}
          </p>
        ) : null}
        {magicState.message ? (
          <p className="text-sm text-success" role="status">
            {magicState.message}
          </p>
        ) : null}
        <Button
          className="w-full"
          variant="outline"
          disabled={magicPending}
          formAction={magicAction}
          type="submit"
        >
          {magicPending ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}

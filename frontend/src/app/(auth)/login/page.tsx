"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getPostAuthPath } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/authStore";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getPostAuthPath(user));
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    try {
      await login({ email: email.trim(), password });
      const currentUser = useAuthStore.getState().user;
      router.replace(getPostAuthPath(currentUser));
    } catch (error) {
      if (error instanceof ApiError) {
        const detail = error.errors?.length
          ? `${error.message}: ${error.errors.join(", ")}`
          : error.message;
        setApiError(detail);
        return;
      }

      setApiError("Something went wrong. Please try again.");
    }
  };

  if (isAuthenticated) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label="Redirecting" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your ShopAI account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {resetSuccess ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Password updated successfully. Sign in with your new password.
          </p>
        ) : null}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {apiError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {apiError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" label="Signing in" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label="Redirecting" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Spinner label="Loading sign in" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

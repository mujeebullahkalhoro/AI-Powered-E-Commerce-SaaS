"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);
    setSuccessMessage(null);
    setDevResetUrl(null);
    setIsSubmitting(true);

    try {
      const data = await forgotPassword(email.trim());
      setSuccessMessage(data.message);
      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const detail = error.errors?.length
          ? `${error.message}: ${error.errors.join(", ")}`
          : error.message;
        setApiError(detail);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Forgot password</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we&apos;ll send reset instructions. Works for both
          customer and admin accounts.
        </p>
      </div>

      {successMessage ? (
        <div className="space-y-4">
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {successMessage}
          </p>

          {devResetUrl ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-medium">Development reset link</p>
              <p className="mt-1 break-all">
                <Link href={devResetUrl} className="underline">
                  {devResetUrl}
                </Link>
              </p>
            </div>
          ) : null}

          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />

          {apiError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {apiError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" label="Sending reset link" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-600">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

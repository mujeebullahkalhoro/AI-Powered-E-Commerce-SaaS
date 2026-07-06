"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: () => void;
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders?success=1`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess();
      return;
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={!stripe || submitting}>
        {submitting ? (
          <>
            <Spinner size="sm" label="Processing payment" />
            Processing...
          </>
        ) : (
          "Complete payment"
        )}
      </Button>
    </form>
  );
}

export function StripePayment({ clientSecret, onSuccess }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Stripe publishable key is not configured.
      </p>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#18181b",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}

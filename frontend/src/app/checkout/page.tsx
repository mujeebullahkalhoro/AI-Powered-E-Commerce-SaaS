"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { createPaymentIntent } from "@/lib/api/orders";
import type { Cart, ShippingAddress } from "@/lib/api/types";
import { useAuthStore } from "@/store/authStore";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { ShippingForm, type ShippingFormValues } from "@/components/checkout/ShippingForm";
import { StripePayment } from "@/components/checkout/StripePayment";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const SHIPPING_FLAT_RATE = 5;
const FREE_SHIPPING_THRESHOLD = 50;

const emptyAddress: ShippingFormValues = {
  name: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

function calculateShipping(subtotal: number): number {
  return subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FLAT_RATE : 0;
}

function validateAddress(values: ShippingFormValues): Partial<Record<keyof ShippingFormValues, string>> {
  const errors: Partial<Record<keyof ShippingFormValues, string>> = {};

  for (const [key, value] of Object.entries(values) as [keyof ShippingFormValues, string][]) {
    if (!value.trim()) {
      errors[key] = "This field is required";
    }
  }

  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof ShippingFormValues, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentTotals, setPaymentTotals] = useState<{
    subtotal: number;
    shippingCost: number;
    total: number;
  } | null>(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCart();
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    fetchCart();
  }, [hydrated, isAuthenticated, router, fetchCart]);

  const handleAddressChange = (field: keyof ShippingFormValues, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    setAddressErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePayNow = async () => {
    const errors = validateAddress(address);
    setAddressErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await createPaymentIntent({
        shippingAddress: address,
        paymentMethod: "card",
      });

      setClientSecret(data.clientSecret);
      setPaymentTotals({
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        total: data.total,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to start checkout",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push("/orders?success=1");
  };

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" label="Loading checkout" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Add items to your cart before checking out.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block text-sm font-medium text-zinc-900 hover:underline"
        >
          Browse products →
        </Link>
      </div>
    );
  }

  const subtotal = paymentTotals?.subtotal ?? cart.totals.subtotal;
  const shippingCost =
    paymentTotals?.shippingCost ?? calculateShipping(cart.totals.subtotal);
  const total = paymentTotals?.total ?? subtotal + shippingCost;
  const showPayment = clientSecret !== null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-zinc-900">Checkout</h1>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Shipping address</h2>
            <div className="mt-6">
              <ShippingForm
                values={address}
                onChange={handleAddressChange}
                errors={addressErrors}
                disabled={showPayment}
              />
            </div>
          </section>

          {showPayment ? (
            <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Payment</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Enter your payment details to complete the order.
              </p>
              <div className="mt-6">
                <StripePayment
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            </section>
          ) : (
            <Button
              size="lg"
              onClick={handlePayNow}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Preparing payment..." : "Pay now"}
            </Button>
          )}
        </div>

        <div className="lg:col-span-1">
          <CheckoutSummary
            items={cart.items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            total={total}
          />
        </div>
      </div>
    </div>
  );
}

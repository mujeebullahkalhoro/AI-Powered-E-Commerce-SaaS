import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping & Delivery — ShopAI",
  description: "Shipping times, delivery areas, and free shipping information.",
};

export default function ShippingPage() {
  return (
    <SupportArticle
      title="Shipping & delivery"
      description="Everything you need to know about how we deliver your orders."
    >
      <Section title="Delivery times">
        <p>
          Standard delivery typically takes <strong>3–7 business days</strong> after your
          order is confirmed. Processing may take 1–2 business days before dispatch.
        </p>
      </Section>

      <Section title="Free shipping">
        <p>
          Enjoy <strong>free standard shipping</strong> on orders over <strong>$50</strong>.
          Shipping fees for smaller orders are calculated at checkout.
        </p>
      </Section>

      <Section title="Delivery areas">
        <p>
          We currently deliver within <strong>Pakistan</strong>. Enter your address at
          checkout to confirm availability for your city.
        </p>
      </Section>

      <Section title="Order tracking">
        <p>
          Track your order anytime from{" "}
          <Link href="/orders" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            My Orders
          </Link>{" "}
          in your account.
        </p>
      </Section>
    </SupportArticle>
  );
}

function SupportArticle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-700">
          <Link href="/faqs" className="hover:underline">
            Help center
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>

      <div className="space-y-8 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

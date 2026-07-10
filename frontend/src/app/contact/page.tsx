import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us — ShopAI",
  description: "Get in touch with ShopAI customer support.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Contact support</h1>
        <p className="mt-2 text-sm text-zinc-500">
          We&apos;re here to help with orders, returns, and account questions.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Email</h2>
          <p className="mt-2 text-sm text-zinc-600">
            For the fastest response, email us with your order number.
          </p>
          <a
            href="mailto:support@shopai.com"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
          >
            support@shopai.com
          </a>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Help center</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Browse common questions about shipping, returns, and payments.
          </p>
          <Link
            href="/faqs"
            className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline"
          >
            View FAQs →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Support hours</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Monday – Saturday, 9:00 AM – 6:00 PM (PKT). We aim to reply within 24 hours on
          business days.
        </p>
      </div>
    </div>
  );
}

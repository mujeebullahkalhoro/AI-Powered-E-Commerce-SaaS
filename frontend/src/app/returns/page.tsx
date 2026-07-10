import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Returns & Refunds — ShopAI",
  description: "Return policy, refund timelines, and how to request a return.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-700">
          <Link href="/faqs" className="hover:underline">
            Help center
          </Link>
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900">Returns & refunds</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Our policy for returns, exchanges, and refund processing.
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-zinc-200 bg-white p-6 sm:p-8">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">14-day return window</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            You may return eligible items within <strong>14 days</strong> of delivery.
            Items must be unused, in original packaging, and in resalable condition.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">How to start a return</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-600">
            <li>Email support with your order number and reason for return.</li>
            <li>Wait for return instructions and the return address.</li>
            <li>Ship the item back using a trackable service.</li>
            <li>Receive your refund after inspection (5–10 business days).</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Non-returnable items</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Final sale items, used products, or items without original packaging may not
            be eligible for return.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Need help?</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Contact us at{" "}
            <a
              href="mailto:support@shopai.com"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              support@shopai.com
            </a>{" "}
            or visit the{" "}
            <Link href="/contact" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

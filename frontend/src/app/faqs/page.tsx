import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion, type FaqItem } from "@/components/support/FaqAccordion";

export const metadata: Metadata = {
  title: "FAQs — ShopAI",
  description: "Frequently asked questions about orders, shipping, returns, and payments.",
};

const faqSections: { title: string; items: FaqItem[] }[] = [
  {
    title: "Orders & account",
    items: [
      {
        question: "Do I need an account to place an order?",
        answer:
          "Yes. You need to sign in or create a free ShopAI account to add items to your cart, save your wishlist, and complete checkout.",
      },
      {
        question: "How can I track my order?",
        answer:
          "After placing an order, go to My Orders in your account menu. You will see your order status, items purchased, and shipping details.",
      },
      {
        question: "Can I change or cancel my order?",
        answer:
          "If your order is still processing, contact support as soon as possible. Once an order has shipped, it cannot be cancelled but may be eligible for return.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        question: "How long does delivery take?",
        answer:
          "Standard delivery usually takes 3–7 business days depending on your location. You will receive updates once your order is confirmed and dispatched.",
      },
      {
        question: "Do you offer free shipping?",
        answer:
          "Yes. Orders over $50 qualify for free standard shipping. Shipping cost is shown at checkout before you pay.",
      },
      {
        question: "Which countries do you ship to?",
        answer:
          "We currently ship within Pakistan. More regions may be added soon. Check the shipping form at checkout for available destinations.",
      },
    ],
  },
  {
    title: "Returns & payments",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "Unused items in original condition can be returned within 14 days of delivery. Contact support to start a return and receive return instructions.",
      },
      {
        question: "How long do refunds take?",
        answer:
          "After we receive and inspect your return, refunds are processed within 5–10 business days to your original payment method.",
      },
      {
        question: "Which payment methods do you accept?",
        answer:
          "We accept major debit and credit cards through Stripe secure checkout. All payments are encrypted and processed safely.",
      },
      {
        question: "Is my payment information secure?",
        answer:
          "Yes. ShopAI uses Stripe for payments. Your card details are never stored on our servers and are handled by Stripe's secure payment system.",
      },
    ],
  },
  {
    title: "AI shopping assistant",
    items: [
      {
        question: "What can the AI assistant help with?",
        answer:
          "The shopping assistant can recommend products, answer questions about categories, and help you find items using natural language — for example, \"bags for women\" or \"comfortable walking shoes\".",
      },
      {
        question: "Who can use the chat assistant?",
        answer:
          "The AI shopping assistant is available to signed-in customers while browsing the store.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Frequently asked questions</h1>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Quick answers about shopping, shipping, returns, and payments at ShopAI.
        </p>
      </div>

      <div className="space-y-10">
        {faqSections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">{section.title}</h2>
            <FaqAccordion items={section.items} />
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Still need help?</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Our support team is happy to assist with orders, returns, or account questions.
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:support@shopai.com"
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Email support
          </a>
          <Link
            href="/contact"
            className="inline-flex rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            Contact page
          </Link>
        </div>
      </div>
    </div>
  );
}

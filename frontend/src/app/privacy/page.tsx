import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/support/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — ShopAI",
  description: "How ShopAI collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="How we handle your personal data when you shop with ShopAI."
    >
      <LegalSection title="Information we collect">
        <p>
          When you create an account, place an order, or contact support, we may
          collect your name, email address, shipping address, order history, and
          payment-related details processed securely through Stripe.
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process and deliver your orders</li>
          <li>Provide customer support and order updates</li>
          <li>Improve our store, search, and AI shopping features</li>
          <li>Prevent fraud and keep the platform secure</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data sharing">
        <p>
          We do not sell your personal data. We share information only with
          trusted service providers required to operate the store, such as
          payment processors and hosting providers, and only as needed to fulfill
          your order or provide our services.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You may request access, correction, or deletion of your account data by
          contacting support. You can also update account details from your
          profile after signing in.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy-related questions, email{" "}
          <a
            href="mailto:support@shopai.com"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline"
          >
            support@shopai.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

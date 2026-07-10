import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/support/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — ShopAI",
  description: "Terms and conditions for using the ShopAI online store.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      description="Please read these terms before using ShopAI."
    >
      <LegalSection title="Using ShopAI">
        <p>
          By accessing or purchasing from ShopAI, you agree to these terms. You
          must be at least 18 years old or have permission from a parent or
          guardian to use this store.
        </p>
      </LegalSection>

      <LegalSection title="Accounts & orders">
        <p>
          You are responsible for keeping your login credentials secure. Order
          confirmations, pricing, and availability are shown at checkout. We
          reserve the right to cancel orders affected by pricing errors, stock
          issues, or suspected fraud.
        </p>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Payments are processed securely through Stripe. By completing checkout,
          you authorize us to charge your selected payment method for the order
          total shown, including applicable shipping fees.
        </p>
      </LegalSection>

      <LegalSection title="Shipping, returns & refunds">
        <p>
          Delivery timelines, return eligibility, and refund processing are
          described in our{" "}
          <Link href="/shipping" className="font-medium text-zinc-900 hover:underline">
            shipping
          </Link>{" "}
          and{" "}
          <Link href="/returns" className="font-medium text-zinc-900 hover:underline">
            returns
          </Link>{" "}
          policies.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          ShopAI is provided on an &quot;as is&quot; basis. To the fullest extent
          permitted by law, we are not liable for indirect or consequential
          damages arising from use of the store or delayed delivery beyond our
          control.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

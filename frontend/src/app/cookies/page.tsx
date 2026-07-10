import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/support/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — ShopAI",
  description: "How ShopAI uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie policy"
      description="How cookies help ShopAI work and how you can control them."
    >
      <LegalSection title="What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help us remember your session, keep you signed in, and
          improve your shopping experience.
        </p>
      </LegalSection>

      <LegalSection title="Cookies we use">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Essential cookies</strong> — required for login, cart, and
            checkout to function.
          </li>
          <li>
            <strong>Preference cookies</strong> — remember settings such as your
            session state.
          </li>
          <li>
            <strong>Security cookies</strong> — help protect your account and
            prevent unauthorized access.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Third-party cookies">
        <p>
          Payment processing through Stripe may set cookies needed to complete
          secure transactions. These are governed by Stripe&apos;s own policies.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          You can control or delete cookies through your browser settings.
          Disabling essential cookies may prevent sign-in, cart, or checkout from
          working correctly.
        </p>
      </LegalSection>

      <LegalSection title="More information">
        <p>
          For questions about data use, see our{" "}
          <Link href="/privacy" className="font-medium text-zinc-900 hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

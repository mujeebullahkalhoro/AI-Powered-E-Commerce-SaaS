import Link from "next/link";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/cart", label: "Cart" },
];

const accountLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
  { href: "/orders", label: "My orders" },
  { href: "/wishlist", label: "Wishlist" },
];

const supportLinks = [
  { href: "/contact", label: "Contact support" },
  { href: "/shipping", label: "Shipping & delivery" },
  { href: "/returns", label: "Returns & refunds" },
  { href: "/faqs", label: "FAQs" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/cookies", label: "Cookie policy" },
];

const trustBadges = [
  { href: "/checkout", label: "Secure checkout", showLock: true },
  { href: "/faqs", label: "Stripe payments" },
  { href: "/shipping", label: "Free shipping over $50" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: InstagramIcon,
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: FacebookIcon,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    icon: XIcon,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: LinkedInIcon,
  },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 pb-20 sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="text-xl font-bold text-zinc-900">
              ShopAI
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-600">
              Discover curated products with AI-powered search, smart
              recommendations, and secure checkout — built for modern shoppers.
            </p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Follow us
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;

                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:col-span-1 sm:grid-cols-3 lg:col-span-8">
            <FooterColumn title="Shop" links={shopLinks} />
            <FooterColumn title="Account" links={accountLinks} />
            <FooterColumn title="Help" links={supportLinks} />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-zinc-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            {trustBadges.map((badge) => (
              <Link
                key={badge.label}
                href={badge.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 transition-colors hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-800"
              >
                {badge.showLock ? <LockIcon /> : null}
                {badge.label}
              </Link>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            Need help?{" "}
            <Link
              href="/contact"
              className="font-medium text-zinc-700 underline-offset-4 hover:underline"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-center text-xs text-zinc-500 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>© {year} ShopAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-800">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M14 8.5h2.5l-.5 3H14v9h-3.5v-9H9V8.5h1.5V6.8c0-2.2 1.3-3.8 3.7-3.8H14v3h-1.1c-.8 0-.9.4-.9 1v1.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M16.3 5h3l-6.5 7.4L20 19h-5.5l-4-5.2L6 19H3l7-8L4 5h5.6l3.6 4.7L16.3 5z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M6.5 8.8H9v10H6.5V8.8zM7.8 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 8.8h2.4v1.4h.1c.3-.6 1.2-1.5 2.5-1.5 2.7 0 3.2 1.8 3.2 4.1V18.8H16.3v-5c0-1.2 0-2.7-1.7-2.7-1.7 0-2 1.3-2 2.6v5.1H11V8.8z" />
    </svg>
  );
}

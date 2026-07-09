import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 pb-20 sm:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-zinc-900">ShopAI</p>
          <p className="mt-1 text-sm text-zinc-500">
            AI-powered e-commerce for modern shopping.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} ShopAI. All rights reserved.
      </div>
    </footer>
  );
}

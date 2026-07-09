"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getCart } from "@/lib/api/cart";
import { isAdminUser } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
];

export function Navbar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setCartCount(0);
      return;
    }

    getCart()
      .then((data) => setCartCount(data.cart.totals.itemCount))
      .catch(() => setCartCount(0));
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation menu"
        >
          <MenuIcon />
        </button>

        <Link href="/" className="shrink-0 text-base font-bold text-zinc-900 sm:text-lg">
          ShopAI
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Suspense fallback={<div className="hidden h-10 flex-1 max-w-md animate-pulse rounded-lg bg-zinc-200 sm:block" />}>
          <SearchBar className="hidden sm:flex" inputClassName="max-w-md" />
        </Suspense>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          {isAuthenticated && isAdmin ? (
            <>
              <Link href="/admin" className="hidden sm:block">
                <Button size="sm">Admin Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : isAuthenticated ? (
            <>
              <Link
                href="/wishlist"
                className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Wishlist"
              >
                <HeartIcon />
              </Link>

              <Link
                href="/cart"
                className="relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <CartIcon />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>

              <div className="relative hidden sm:block" ref={menuRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="max-w-[140px] truncate"
                >
                  <span className="truncate">{user?.name ?? "Account"}</span>
                </Button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                  >
                    <Link
                      href="/orders"
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-50"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>

              <Link href="/orders" className="sm:hidden">
                <Button variant="outline" size="sm">
                  Account
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Register</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileNavOpen ? (
        <nav className="border-t border-zinc-100 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Admin Dashboard
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-zinc-50"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
                  onClick={() => setMobileNavOpen(false)}
                >
                  My Orders
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-zinc-50"
                  onClick={() => {
                    setMobileNavOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:hidden"
                onClick={() => setMobileNavOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      ) : null}

      <div className="border-t border-zinc-100 px-4 py-2 sm:hidden">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-zinc-200" />}>
          <SearchBar showButton={false} />
        </Suspense>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
      />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import HeaderSearch from "@/components/molecules/HeaderSearch";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cart } = useCart();
  const { customer, isAuthenticated, logout, isLoading } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const itemCount = cart?.itemCount ?? 0;

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            Boutique
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/produits"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Produits
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Catégories
            </Link>
            <Link
              href="/collections"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Collections
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <HeaderSearch />

            {/* Account */}
            {isLoading ? (
              <div className="h-5 w-5 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
            ) : isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  aria-label="Mon compte"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                    {customer?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium lg:inline">
                    {customer?.firstName}
                  </span>
                  <svg
                    className={cn(
                      "hidden h-4 w-4 transition-transform lg:block",
                      userMenuOpen && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {customer?.firstName} {customer?.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {customer?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/compte"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Mon compte
                      </Link>
                      <Link
                        href="/compte/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Mes commandes
                      </Link>
                      <Link
                        href="/compte/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Mes adresses
                      </Link>
                    </div>
                    <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/connexion"
                className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                aria-label="Connexion"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/panier"
              className="relative text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              aria-label={`Panier (${itemCount} article${itemCount > 1 ? "s" : ""})`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t border-zinc-200 py-4 md:hidden dark:border-zinc-800">
            <div className="flex flex-col gap-4">
              <Link
                href="/produits"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Produits
              </Link>
              <Link
                href="/categories"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Catégories
              </Link>
              <Link
                href="/collections"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Collections
              </Link>

              {/* Mobile auth links */}
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                {isAuthenticated ? (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                        {customer?.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-xs text-zinc-500">{customer?.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/compte"
                      className="block py-2 text-sm text-zinc-600 dark:text-zinc-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mon compte
                    </Link>
                    <Link
                      href="/compte/orders"
                      className="block py-2 text-sm text-zinc-600 dark:text-zinc-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mes commandes
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="block py-2 text-sm text-red-600 dark:text-red-400"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <div className="flex gap-4">
                    <Link
                      href="/connexion"
                      className="text-sm font-medium text-zinc-900 dark:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/inscription"
                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

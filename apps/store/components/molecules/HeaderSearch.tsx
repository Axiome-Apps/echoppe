"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getAssetUrl } from "@/lib/utils";
import { api } from "@/lib/api";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  featuredImage: string | null;
  defaultVariant: {
    priceHt: string;
  } | null;
}

export default function HeaderSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setValue("");
    setResults([]);
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };

    // Delay to avoid immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === "Escape") {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch]);

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.products.get({
        query: { search: query, limit: 6 },
      });

      const publishedProducts = (data?.data ?? [])
        .filter((p) => p.status === "published")
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          featuredImage: p.featuredImage,
          defaultVariant: p.defaultVariant,
        }));

      setResults(publishedProducts);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setSelectedIndex(-1);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchProducts(newValue);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/produits/${results[selectedIndex].slug}`);
        closeSearch();
      } else if (value.trim()) {
        router.push(`/produits?search=${encodeURIComponent(value.trim())}`);
        closeSearch();
      }
    }
  };

  const formatPrice = (priceHt: string) => {
    const price = parseFloat(priceHt) * 1.2; // Assuming 20% VAT
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        aria-label="Rechercher (Cmd+K)"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={closeSearch}
      />

      {/* Search modal */}
      <div className="fixed inset-x-0 top-0 z-50 p-4 sm:p-6 md:p-20">
        <div className="mx-auto max-w-xl">
          <div
            ref={modalRef}
            className={cn(
              "overflow-hidden rounded-xl shadow-2xl",
              "bg-white dark:bg-zinc-900",
              "border border-zinc-200 dark:border-zinc-700"
            )}
          >
            {/* Search input */}
            <div className="flex items-center border-b border-zinc-100 dark:border-zinc-800">
              <svg
                className={cn(
                  "ml-4 h-5 w-5 text-zinc-400",
                  isSearching && "animate-pulse"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher un produit..."
                className={cn(
                  "flex-1 bg-transparent px-4 py-4 text-base outline-none",
                  "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                )}
              />
              <div className="mr-4 flex items-center gap-2">
                <kbd className="hidden rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 sm:inline-block dark:border-zinc-700 dark:bg-zinc-800">
                  Échap
                </kbd>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results */}
            {value.length >= 2 && (
              <div className="max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <svg
                      className="h-6 w-6 animate-spin text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                ) : results.length > 0 ? (
                  <ul className="py-2">
                    {results.map((product, index) => (
                      <li key={product.id}>
                        <Link
                          href={`/produits/${product.slug}`}
                          onClick={closeSearch}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 transition-colors",
                            index === selectedIndex
                              ? "bg-zinc-100 dark:bg-zinc-800"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          )}
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            {product.featuredImage ? (
                              <Image
                                src={getAssetUrl(product.featuredImage)}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-zinc-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-white">
                              {product.name}
                            </p>
                            {product.defaultVariant && (
                              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {formatPrice(product.defaultVariant.priceHt)}
                              </p>
                            )}
                          </div>
                          <svg
                            className="h-5 w-5 shrink-0 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Aucun produit trouvé pour "{value}"
                    </p>
                  </div>
                )}

                {/* See all results link */}
                {results.length > 0 && (
                  <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
                    <Link
                      href={`/produits?search=${encodeURIComponent(value)}`}
                      onClick={closeSearch}
                      className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Voir tous les résultats
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Helper text when no query */}
            {value.length < 2 && (
              <div className="py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Tapez au moins 2 caractères pour rechercher
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

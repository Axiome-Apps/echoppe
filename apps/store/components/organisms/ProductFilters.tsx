"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/atoms/Button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  className?: string;
  basePath?: string;
}

export default function ProductFilters({
  categories,
  className,
  basePath = "/produits",
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") ?? "";
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const currentInStock = searchParams.get("inStock") === "true";

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 1 when filtering
      params.delete("page");

      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [router, searchParams, basePath]
  );

  const handleCategoryChange = (categoryId: string) => {
    updateFilters({ category: categoryId || null });
  };

  const handleInStockChange = (checked: boolean) => {
    updateFilters({ inStock: checked ? "true" : null });
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => {
      router.push(basePath);
    });
  };

  const hasActiveFilters = currentCategory || currentMinPrice || currentMaxPrice || currentInStock;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
          Catégories
        </h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="category"
              checked={!currentCategory}
              onChange={() => handleCategoryChange("")}
              className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Toutes les catégories
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="category"
                checked={currentCategory === cat.id}
                onChange={() => handleCategoryChange(cat.id)}
                className="h-4 w-4 border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">
          Prix
        </h3>
        <form onSubmit={handlePriceSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm",
                "bg-white dark:bg-zinc-900",
                "border-zinc-300 dark:border-zinc-700",
                "placeholder:text-zinc-400",
                "focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              )}
            />
            <span className="text-zinc-400">-</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm",
                "bg-white dark:bg-zinc-900",
                "border-zinc-300 dark:border-zinc-700",
                "placeholder:text-zinc-400",
                "focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              )}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="w-full" disabled={isPending}>
            Appliquer
          </Button>
        </form>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => handleInStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            En stock uniquement
          </span>
        </label>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface SortOption {
  label: string;
  value: string;
  sort?: string;
  order?: string;
}

const sortOptions: SortOption[] = [
  { label: "Plus récents", value: "date-desc", sort: "date", order: "desc" },
  { label: "Plus anciens", value: "date-asc", sort: "date", order: "asc" },
  { label: "Prix croissant", value: "price-asc", sort: "price", order: "asc" },
  { label: "Prix décroissant", value: "price-desc", sort: "price", order: "desc" },
  { label: "Nom A-Z", value: "name-asc", sort: "name", order: "asc" },
  { label: "Nom Z-A", value: "name-desc", sort: "name", order: "desc" },
];

interface SortSelectProps {
  className?: string;
  basePath?: string;
}

export default function SortSelect({
  className,
  basePath = "/produits",
}: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "date";
  const currentOrder = searchParams.get("order") ?? "desc";
  const currentValue = `${currentSort}-${currentOrder}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = sortOptions.find((opt) => opt.value === e.target.value);
    if (!selected) return;

    const params = new URLSearchParams(searchParams.toString());

    if (selected.sort) {
      params.set("sort", selected.sort);
    } else {
      params.delete("sort");
    }

    if (selected.order) {
      params.set("order", selected.order);
    } else {
      params.delete("order");
    }

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor="sort" className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
        Trier par
      </label>
      <select
        id="sort"
        value={currentValue}
        onChange={handleChange}
        disabled={isPending}
        className={cn(
          "rounded-lg border px-3 py-2 text-sm transition-colors",
          "bg-white dark:bg-zinc-900",
          "border-zinc-300 dark:border-zinc-700",
          "focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

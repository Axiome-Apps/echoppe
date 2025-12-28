"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface OptionValue {
  id: string;
  value: string;
}

interface Option {
  id: string;
  name: string;
  values: OptionValue[];
}

interface Variant {
  id: string;
  optionValues: string[];
  quantity: number;
  status: string;
}

interface ProductOptionsProps {
  options: Option[];
  variants: Variant[];
  onVariantChange?: (variantId: string | null) => void;
}

export default function ProductOptions({
  options,
  variants,
  onVariantChange,
}: ProductOptionsProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  // Find the variant that matches the selected options
  const selectedVariant = useMemo(() => {
    const selectedIds = Object.values(selectedValues);
    if (selectedIds.length !== options.length) return null;

    return variants.find((v) =>
      selectedIds.every((id) => v.optionValues.includes(id))
    ) ?? null;
  }, [selectedValues, options.length, variants]);

  // Check if a value is available (has at least one variant in stock)
  const isValueAvailable = (optionId: string, valueId: string) => {
    const otherSelections = { ...selectedValues };
    delete otherSelections[optionId];
    const otherSelectedIds = Object.values(otherSelections);

    return variants.some((v) => {
      const hasValue = v.optionValues.includes(valueId);
      const matchesOthers = otherSelectedIds.every((id) =>
        v.optionValues.includes(id)
      );
      return hasValue && matchesOthers && v.quantity > 0 && v.status === "published";
    });
  };

  const handleValueSelect = (optionId: string, valueId: string) => {
    const newValues = { ...selectedValues, [optionId]: valueId };
    setSelectedValues(newValues);

    // Find matching variant
    const selectedIds = Object.values(newValues);
    if (selectedIds.length === options.length) {
      const variant = variants.find((v) =>
        selectedIds.every((id) => v.optionValues.includes(id))
      );
      onVariantChange?.(variant?.id ?? null);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.id}>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {option.name}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedValues[option.id] === value.id;
              const isAvailable = isValueAvailable(option.id, value.id);

              return (
                <button
                  key={value.id}
                  type="button"
                  onClick={() => handleValueSelect(option.id, value.id)}
                  disabled={!isAvailable}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600",
                    !isAvailable && "cursor-not-allowed opacity-50 line-through"
                  )}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && selectedVariant.quantity <= 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Cette combinaison est en rupture de stock
        </p>
      )}
    </div>
  );
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  priceHt: string | number,
  taxRate = 20,
  locale = "fr-FR",
  currency = "EUR"
): string {
  const ht = typeof priceHt === "string" ? parseFloat(priceHt) : priceHt;
  const ttc = ht * (1 + taxRate / 100);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(ttc);
}

export function formatPriceHt(
  priceHt: string | number,
  locale = "fr-FR",
  currency = "EUR"
): string {
  const ht = typeof priceHt === "string" ? parseFloat(priceHt) : priceHt;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(ht);
}

export function getAssetUrl(assetId: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7532";
  return `${apiUrl}/assets/${assetId}`;
}
